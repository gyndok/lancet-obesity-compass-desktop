import { ipcMain } from 'electron';
import { getDatabase } from './database';
import crypto from 'crypto';

interface CreateVisitInput {
  patient_label?: string;
  height_feet?: number;
  height_inches?: number;
  weight_lbs?: number;
  bmi?: number;
  responses: string;
  assessment?: string;
  elapsed_time?: number;
  notes?: string;
}

interface UpdateVisitInput extends Partial<CreateVisitInput> {}

export function registerIpcHandlers(): void {
  const db = getDatabase();

  const insertVisit = db.prepare(`
    INSERT INTO visits (id, patient_label, is_draft, created_at, updated_at,
      height_feet, height_inches, weight_lbs, bmi, responses, assessment, elapsed_time, notes)
    VALUES (?, ?, 0, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const selectVisit = db.prepare('SELECT * FROM visits WHERE id = ?');

  const selectAllVisits = db.prepare(`
    SELECT id, patient_label, created_at, bmi,
      COALESCE(json_extract(assessment, '$.result.classification'), json_extract(assessment, '$.classification')) as classification,
      elapsed_time
    FROM visits WHERE is_draft = 0 ORDER BY created_at DESC
  `);

  const searchVisits = db.prepare(`
    SELECT id, patient_label, created_at, bmi,
      COALESCE(json_extract(assessment, '$.result.classification'), json_extract(assessment, '$.classification')) as classification,
      elapsed_time
    FROM visits WHERE is_draft = 0 AND patient_label LIKE ? ORDER BY created_at DESC
  `);

  const deleteVisitStmt = db.prepare('DELETE FROM visits WHERE id = ?');

  const upsertDraft = db.prepare(`
    INSERT INTO visits (id, patient_label, is_draft, created_at, updated_at,
      height_feet, height_inches, weight_lbs, bmi, responses, assessment,
      elapsed_time, notes, current_question_index)
    VALUES (?, ?, 1, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(id) DO UPDATE SET
      patient_label=excluded.patient_label, updated_at=excluded.updated_at,
      height_feet=excluded.height_feet, height_inches=excluded.height_inches,
      weight_lbs=excluded.weight_lbs, bmi=excluded.bmi,
      responses=excluded.responses, assessment=excluded.assessment,
      elapsed_time=excluded.elapsed_time, notes=excluded.notes,
      current_question_index=excluded.current_question_index
  `);

  const selectDraft = db.prepare('SELECT * FROM visits WHERE is_draft = 1 LIMIT 1');
  const deleteDrafts = db.prepare('DELETE FROM visits WHERE is_draft = 1');

  const updateVisitStmt = db.prepare(`
    UPDATE visits SET
      patient_label=COALESCE(?,patient_label), height_feet=COALESCE(?,height_feet),
      height_inches=COALESCE(?,height_inches), weight_lbs=COALESCE(?,weight_lbs),
      bmi=COALESCE(?,bmi), responses=COALESCE(?,responses),
      assessment=COALESCE(?,assessment), elapsed_time=COALESCE(?,elapsed_time),
      notes=COALESCE(?,notes), updated_at=?
    WHERE id = ?
  `);

  // visit:create
  ipcMain.handle('visit:create', (_event, data: CreateVisitInput) => {
    try {
      const id = crypto.randomUUID();
      const now = new Date().toISOString();
      insertVisit.run(id, data.patient_label || null, now, now,
        data.height_feet ?? null, data.height_inches ?? null,
        data.weight_lbs ?? null, data.bmi ?? null,
        data.responses, data.assessment || null,
        data.elapsed_time ?? null, data.notes || null);
      deleteDrafts.run();
      return selectVisit.get(id);
    } catch (err: any) { return { error: err.message }; }
  });

  // visit:get
  ipcMain.handle('visit:get', (_event, id: string) => {
    try { return selectVisit.get(id) || null; }
    catch (err: any) { return { error: err.message }; }
  });

  // visit:list
  ipcMain.handle('visit:list', () => {
    try { return selectAllVisits.all(); }
    catch (err: any) { return { error: err.message }; }
  });

  // visit:search
  ipcMain.handle('visit:search', (_event, query: string) => {
    try { return searchVisits.all(`%${query}%`); }
    catch (err: any) { return { error: err.message }; }
  });

  // visit:update
  ipcMain.handle('visit:update', (_event, id: string, data: UpdateVisitInput) => {
    try {
      const existing = selectVisit.get(id) as any;
      if (!existing) return { error: 'Visit not found' };
      const now = new Date().toISOString();
      updateVisitStmt.run(
        data.patient_label ?? null, data.height_feet ?? null,
        data.height_inches ?? null, data.weight_lbs ?? null,
        data.bmi ?? null, data.responses ?? null,
        data.assessment ?? null, data.elapsed_time ?? null,
        data.notes ?? null, now, id);
      return selectVisit.get(id);
    } catch (err: any) { return { error: err.message }; }
  });

  // visit:delete
  ipcMain.handle('visit:delete', (_event, id: string) => {
    try { return deleteVisitStmt.run(id).changes > 0; }
    catch (err: any) { return { error: err.message }; }
  });

  // visit:save-draft
  ipcMain.handle('visit:save-draft', (_event, data: CreateVisitInput & { id?: string; current_question_index?: number }) => {
    try {
      deleteDrafts.run();
      const id = data.id || crypto.randomUUID();
      const now = new Date().toISOString();
      upsertDraft.run(id, data.patient_label || null, now, now,
        data.height_feet ?? null, data.height_inches ?? null,
        data.weight_lbs ?? null, data.bmi ?? null,
        data.responses || '[]', data.assessment || null,
        data.elapsed_time ?? null, data.notes || null,
        data.current_question_index ?? 0);
      return selectVisit.get(id);
    } catch (err: any) { return { error: err.message }; }
  });

  // visit:get-draft
  ipcMain.handle('visit:get-draft', () => {
    try { return selectDraft.get() || null; }
    catch (err: any) { return { error: err.message }; }
  });

  // visit:discard-draft
  ipcMain.handle('visit:discard-draft', () => {
    try { deleteDrafts.run(); return true; }
    catch (err: any) { return { error: err.message }; }
  });
}

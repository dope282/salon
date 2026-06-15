// Серверт ашиглах admin builder (Supabase service-role client-ийг орлоно).
// QPay route-ууд (callback/check/cancel/create-invoice) үүнийг өөрчлөлтгүй ашиглана.
// ЗӨВХӨН серверт — queryEngine рүү шууд дуудна (эрх шалгахгүй, admin).
import { runQuery, adminIdentity } from './queryEngine';

class AdminBuilder {
  constructor(table) {
    this._d = { table, op: 'select', select: '*', filters: [], order: [], single: null, returning: false };
  }
  select(cols = '*') {
    if (this._d.op === 'select') this._d.select = cols || '*';
    else { this._d.returning = true; this._d.select = cols || '*'; }
    return this;
  }
  insert(values) { this._d.op = 'insert'; this._d.values = values; return this; }
  update(values) { this._d.op = 'update'; this._d.values = values; return this; }
  upsert(values) { this._d.op = 'upsert'; this._d.values = values; return this; }
  delete() { this._d.op = 'delete'; return this; }

  eq(col, val)  { this._d.filters.push({ col, op: 'eq',  val }); return this; }
  neq(col, val) { this._d.filters.push({ col, op: 'neq', val }); return this; }
  in(col, arr)  { this._d.filters.push({ col, op: 'in',  val: arr }); return this; }
  order(col, opts) { this._d.order.push({ col, ascending: opts?.ascending !== false }); return this; }
  limit(n) { this._d.limit = n; return this; }
  single() { this._d.single = 'single'; return this; }
  maybeSingle() { this._d.single = 'maybe'; return this; }

  _run() { return runQuery(this._d, adminIdentity()); }
  then(resolve, reject) { return this._run().then(resolve, reject); }
  catch(cb) { return this._run().catch(cb); }
  finally(cb) { return this._run().finally(cb); }
}

export const supabaseAdmin = {
  from: (table) => new AdminBuilder(table),
};

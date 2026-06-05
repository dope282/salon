-- Артист бүрийн төлбөрийн аргын тохиргоо
-- pay_qpay: QPay-ээр (онлайн урьдчилгаа) төлөх боломжтой эсэх
-- pay_cash: Бэлнээр (салон дээр) төлөх боломжтой эсэх

ALTER TABLE artists ADD COLUMN IF NOT EXISTS pay_qpay BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE artists ADD COLUMN IF NOT EXISTS pay_cash BOOLEAN NOT NULL DEFAULT false;

-- Confirmar o depósito mais recente (R$1 pago via PIX)
UPDATE deposits 
SET status = 'confirmed', confirmed_at = now() 
WHERE id = '14944015-fd0a-4910-8fd0-5222bb27c9b0' AND status = 'pending';

-- Creditar o saldo do lead
SELECT increment_balance('ea44b161-a8d7-4409-9f25-4c9710a3c1e4', 100);
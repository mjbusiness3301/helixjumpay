-- Insert missing commissions for the 2 confirmed deposits (100 centavos each, 30% = 30 centavos each)
INSERT INTO affiliate_commissions (affiliate_id, deposit_id, amount, available_at, status, released_at)
VALUES 
  ('25785174-3dfa-4436-bd6e-6063998d25f0', '14944015-fd0a-4910-8fd0-5222bb27c9b0', 30, now(), 'released', now()),
  ('25785174-3dfa-4436-bd6e-6063998d25f0', '48e13360-3515-444f-a90a-14ea17d3879a', 30, now(), 'released', now());

-- Credit the affiliate balance (already released since these are old deposits)
UPDATE affiliates SET balance = balance + 0.60 WHERE id = '25785174-3dfa-4436-bd6e-6063998d25f0';
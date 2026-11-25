-- Rolling this migration back removes saved retry receipts. Stop batch writes first.
DROP TABLE IF EXISTS t_order_batch;

CREATE TABLE IF NOT EXISTS t_order_batch (
  createUser int NOT NULL,
  requestId varchar(64) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
  payloadHash char(64) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
  orderIds text NOT NULL,
  createTime varchar(20) NOT NULL,
  PRIMARY KEY (createUser, requestId)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

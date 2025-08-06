# PostgreSQL在ERP系統中的應用

## 1. ERP資料庫設計原則
- 採用正規化設計，消除重複資料，確保一致性
- 使用外鍵維護資料完整性
- 分區表（Partition Table）處理大數據量（如交易、日誌）
- 支援多語系、時區、貨幣欄位設計

## 2. 效能優化
- 適當建立索引（B-tree、GIN、GiST）
- 使用EXPLAIN分析查詢計劃，優化慢查詢
- 利用Materialized View加速報表
- 設定連線池（PgBouncer、Pgpool-II）
- 定期VACUUM、ANALYZE維護效能

## 3. 高可用與備份還原
- 主從複寫（Streaming Replication）
- 自動故障切換（Patroni、repmgr）
- WAL日誌與PITR（Point-in-Time Recovery）
- 定期全備份（pg_dump、pgBackRest、Barman）
- 雲端備份（S3、GCS）

## 4. 雲端與容器化部署
- 支援Docker、Kubernetes部署（StatefulSet、Operator）
- 雲端RDS服務（AWS RDS、GCP Cloud SQL、Azure Database for PostgreSQL）
- 以PostgreSQL為後端的ERP（如ERPNext、Odoo、PostERP）

## 5. 進階應用案例
- [PGFS: Using PostgreSQL as a File System](https://pigsty.io/blog/pg/pgfs/)：JuiceFS+PostgreSQL實現檔案系統PITR，ERP/Odoo檔案與資料同步回復
- [Tera Rows PostERP](https://www.terarows.com)：以PostgreSQL為核心的台灣製造業ERP，支援雲端/本地、低程式碼、即時報表
- ERPNext、Odoo等開源ERP支援PostgreSQL

## 6. 工具與文件
- [PostgreSQL官方文件](https://www.postgresql.org/docs/)
- [Pigsty：PostgreSQL生產級發行版](https://pigsty.io/)
- [pgBackRest](https://pgbackrest.org/)、[Barman](https://www.pgbarman.org/)
- [JuiceFS](https://juicefs.com/)

## 7. 參考文章
- [PGFS: Using PostgreSQL as a File System](https://pigsty.io/blog/pg/pgfs/)
- [Tera Rows LinkedIn](https://www.linkedin.com/company/tera-rows) 
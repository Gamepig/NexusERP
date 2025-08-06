# NexusERP 專案專用 MCP Server 設計：NexusERP_Data_Gateway_MCP

## 1. 伺服器概觀

*   **伺服器名稱:** `NexusERP_Data_Gateway_MCP`
*   **伺服器描述:** 此 MCP 伺服器作為 NexusERP 專案的統一外部數據網關，整合了來自不同來源的數據，包括行業新聞、經濟指標、天氣預報、市場價格、供應商資訊和法律法規，為 AI 功能提供必要的外部上下文。
*   **目標:** 簡化 AI 對外部數據的訪問，將多個潛在的 API 調用封裝成邏輯化的 MCP 工具。

## 2. 工具詳情 (按數據類別分類)

### 2.1. 行業新聞與社群媒體趨勢 (Industry News & Social Media Trends)

*   **目標:** 提供最新的行業動態、新聞文章和社群媒體上的相關趨勢，用於需求預測、供應商背景了解、法規監控和知識庫更新。
*   **工具 1: `search_news_and_trends`**
    *   **描述:** 根據關鍵字、日期範圍、來源或語言搜索相關的新聞文章和社群媒體趨勢。
    *   **參數:**
        *   `query` (string, **必需**): 搜索的關鍵詞或主題。
        *   `start_date` (string, 可選, 格式 'YYYY-MM-DD'): 搜索起始日期。
        *   `end_date` (string, 可選, 格式 'YYYY-MM-DD'): 搜索結束日期。
        *   `sources` (list[string], 可選): 指定新聞來源域名 (例如 `['bloomberg.com', 'reuters.com']`)。
        *   `social_platforms` (list[string], 可選): 指定社群平台 (例如 `['X', 'Reddit']`)，若後端支援。
        *   `language` (string, 可選, 預設 'zh-TW'): 結果語言。
        *   `max_results` (integer, 可選, 預設 10): 返回的最大結果數量。
    *   **返回值:** 一個包含新聞/趨勢條目的列表，每個條目包含：`title` (標題), `snippet` (摘要), `url` (來源連結), `source_name` (來源名稱), `published_date` (發布日期), `relevance_score` (相關性評分，可選), `sentiment` (情感評分，可選)。
    *   **潛在後端 API:** News API, NewsData.io, Google Trends (透過第三方), 或整合現有的新聞/搜索 MCP Server (如 `Google News MCP`)。

### 2.2. 經濟指標 (Economic Indicators)

*   **目標:** 提供宏觀經濟數據，支持需求預測模型。
*   **工具 1: `get_economic_indicators`**
    *   **描述:** 根據指定的指標代碼、地理區域和時間範圍，檢索經濟指標數據。
    *   **參數:**
        *   `indicator_codes` (list[string], **必需**): 需要查詢的經濟指標代碼 (例如 `['GDP_ GROWTH', 'CPI', 'UNEMPLOYMENT_RATE']` - 需要定義內部代碼映射到實際 API 的標識符)。
        *   `regions` (list[string], **必需**): 地理區域代碼 (例如 `['TWN', 'USA', 'WLD']` - 使用 ISO 國家代碼或世界銀行代碼)。
        *   `start_year` (integer, 可選): 起始年份。
        *   `end_year` (integer, 可選): 結束年份 (若不提供，則返回最新數據)。
        *   `frequency` (string, 可選, 預設 'annual'): 數據頻率 ('annual', 'quarterly', 'monthly')。
    *   **返回值:** 一個字典，鍵為指標代碼，值為包含區域、年份/季度/月份和對應數值的列表。
    *   **潛在後端 API:** World Bank API, FRED API, Trading Economics API (需要訂閱)。

### 2.3. 天氣預報 (Weather Forecasts)

*   **目標:** 提供特定地點的天氣預報，輔助需求預測 (特別是受天氣影響的行業)。
*   **工具 1: `get_weather_forecast`**
    *   **描述:** 獲取指定地點未來幾天的天氣預報。
    *   **參數:**
        *   `location` (string, **必需**): 地點名稱 (例如 '台北市') 或經緯度。
        *   `forecast_days` (integer, 可選, 預設 3): 需要預報的天數 (最大值取決於後端 API)。
        *   `units` (string, 可選, 預設 'metric'): 單位 ('metric' 或 'imperial')。
    *   **返回值:** 一個包含每日預報的列表，每個條目包含：`date` (日期), `max_temp` (最高溫), `min_temp` (最低溫), `precipitation_prob` (降水機率), `precipitation_amount` (降水量), `condition_summary` (天氣狀況摘要)。
    *   **潛在後端 API:** OpenWeatherMap API, WeatherAPI.com。

### 2.4. 市場價格與商品指數 (Market Prices & Commodity Indices)

*   **目標:** 提供原材料、商品或金融指數的價格信息，用於成本預測和定價策略。
*   **工具 1: `get_market_prices`**
    *   **描述:** 檢索指定商品、貨幣或指數的當前或歷史市場價格。
    *   **參數:**
        *   `item_codes` (list[string], **必需**): 需要查詢的項目代碼 (例如 `['GOLD_USD', 'OIL_WTI', 'COPPER_LME', 'USD_TWD']` - 需要定義內部代碼)。
        *   `start_date` (string, 可選, 格式 'YYYY-MM-DD'): 歷史數據起始日期。
        *   `end_date` (string, 可選, 格式 'YYYY-MM-DD'): 歷史數據結束日期 (若不提供 start/end date，則返回最新價格)。
        *   `currency` (string, 可選, 預設 'USD'): 目標貨幣。
    *   **返回值:** 一個字典，鍵為項目代碼，值為包含日期和價格的列表。
    *   **潛在後端 API:** CommodityPriceAPI.com, Tradefeeds, API Ninjas, Trading Economics API (需要訂閱)。

### 2.5. 供應商數據與 B2B 平台資訊 (Supplier Data & B2B Platform Information)

*   **目標:** 輔助尋找和評估潛在供應商。(實現挑戰較大)
*   **工具 1: `search_suppliers`**
    *   **描述:** 根據產品、服務、行業或地點搜索潛在供應商。*注意：此功能可能主要依賴內部數據庫或觸發外部通用搜索，結果可能不完整。*
    *   **參數:**
        *   `query` (string, **必需**): 搜索的產品、服務或能力。
        *   `industry` (string, 可選): 行業類別。
        *   `location` (string, 可選): 地理位置。
        *   `min_rating` (float, 可選): 最低內部評分 (如果適用)。
        *   `max_results` (integer, 可選, 預設 5): 返回的最大結果數量。
    *   **返回值:** 潛在供應商列表，每個條目包含：`supplier_id` (內部 ID，若有), `name` (名稱), `location` (地點), `summary` (簡介/主要業務), `website` (網址，可選), `internal_rating` (內部評分，可選)。
    *   **潛在後端 API/策略:** 主要查詢 NexusERP 內部供應商數據庫；次要可觸發 `Web Search` 類工具進行外部搜索 (需謹慎設計提示詞和後處理)；或調用特定行業 API (如 Octopart)。
*   **工具 2: `get_supplier_details`**
    *   **描述:** 根據供應商 ID 從內部數據庫獲取詳細信息。
    *   **參數:**
        *   `supplier_id` (string, **必需**): NexusERP 系統內的供應商唯一標識符。
    *   **返回值:** 包含供應商詳細信息的字典 (例如：聯繫方式、認證、歷史訂單摘要、評分詳情等)。
    *   **潛在後端 API/策略:** 查詢 NexusERP 內部數據庫。

### 2.6. 法律法規資訊 (Laws & Regulations Information)

*   **目標:** 提供與特定主題或行業相關的法律法規信息。(實現挑戰較大)
*   **工具 1: `search_regulations`**
    *   **描述:** 根據關鍵字、主題或司法管轄區搜索相關的法律、法規或合規性文件。*注意：覆蓋範圍和準確性可能有限，可能依賴外部通用搜索。*
    *   **參數:**
        *   `query` (string, **必需**): 搜索的法規主題或關鍵字 (例如 '數據隱私', 'AI 風險管理')。
        *   `jurisdiction` (string, 可選): 司法管轄區代碼 (例如 'USA', 'EU', 'TWN')。
        *   `document_type` (string, 可選): 文件類型 (例如 'law', 'regulation', 'guideline')。
        *   `max_results` (integer, 可選, 預設 5): 返回的最大結果數量。
    *   **返回值:** 相關法規文件列表，每個條目包含：`title` (標題), `summary` (摘要), `url` (來源連結), `jurisdiction` (管轄區), `document_type` (文件類型)。
    *   **潛在後端 API/策略:** 調用 Regulations.gov API (美國), 國家特定 API (如 EUR-Lex)；或觸發 `Web Search` 類工具進行外部搜索，並進行後處理以提取關鍵信息。

## 3. 實現考量

*   **API 金鑰管理:** 需要安全地存儲和管理所有後端 API 的金鑰。
*   **錯誤處理:** 為每個工具實現健壯的錯誤處理機制，處理 API 請求失敗、超時或返回無效數據的情況。
*   **數據聚合與轉換:** 伺服器內部需要邏輯來調用合適的後端 API，並將返回的數據轉換為 MCP 工具定義的統一格式。
*   **成本控制:** 監控對付費 API 的調用次數，避免超出預算。
*   **異步處理:** 對於可能耗時較長的請求 (如複雜搜索或數據抓取)，考慮採用異步處理模式。
*   **可擴展性:** 設計應考慮未來可能需要添加新的數據源或工具。 
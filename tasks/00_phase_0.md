# Phase 0：AI 引導式註冊/Onboarding（最高優先）

## 目標
- 實現 AI 驅動的註冊/Onboarding 流程，支援第三方登入、自然語言輸入、AI 分類、互動式資料補全，並完成資料驗證與註冊。

---

## 前端（UI/UX）
- [ ] 註冊主頁元件設計（RegisterPage.vue/tsx）
- [ ] 實作 handleOAuthLogin(provider)
- [ ] 實作 submitUserInput()
- [ ] 實作 displayAIClassificationResult(yamlData)
- [ ] 實作 editAndConfirmUserProfile()
- [ ] 實作 registerUserToBackend()
- [ ] 註冊流程 UX 測試（E2E）

## 後端（API/邏輯）
- [ ] API: POST /api/register/ai
- [ ] API: POST /api/register/oauth
- [ ] parseUserInputToYAML(input: str) -> dict
- [ ] classifyUserIndustry(yamlData: dict) -> dict
- [ ] validateRegistrationData(data: dict) -> bool
- [ ] saveUserProfile(data: dict) -> User

## AI 串接
- [ ] callOpenRouterAI(input: str) -> yaml
- [ ] extractClassificationFromYAML(yaml: str) -> dict

## 測試與驗證
- [ ] test_parseUserInputToYAML()
- [ ] test_classifyUserIndustry()
- [ ] test_validateRegistrationData()
- [ ] 前端 E2E 註冊流程自動化測試

---

> 所有子任務需同步撰寫註解與技術文件，並依進度追蹤。 
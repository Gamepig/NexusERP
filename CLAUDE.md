# Task Master AI - Claude Code Integration Guide

## ⚠️ **MANDATORY: Claude Code Rules Compliance**

**Claude Code 必須嚴格遵循專案規則文件：**

- **🚨 核心開發規則**：`CLAUDE_CODE_RULES.md` - **強制性規範**（包含分析驗證規則、錯誤預防準則等）
- **專案知識庫**：`frontend/memory-bank/` - 錯誤記錄、經驗教訓、系統模式等知識管理
- **技術規範文件**：如存在相關的開發規範和資料庫規範文件

**每次對話開始時必須：**
1. **📖 讀取 `CLAUDE_CODE_RULES.md`** - 了解所有強制性規則和禁止行為
2. **🧪 實際測試優於程式碼推測** - 任何功能分析都必須通過實際測試驗證
3. **🔧 善用現有工具** - 優先使用專案配置的 MCP 工具和測試資源
4. **📝 基於事實報告** - 所有評估必須有具體證據支持，避免過度推測
5. **🔄 記錄錯誤教訓** - 犯錯時立即記錄到知識庫，避免重複錯誤

**違反規則的嚴重後果：**
- **分析錯誤**：基於錯誤推測導致用戶體驗問題
- **資源浪費**：忽略現有工具造成開發效率低下  
- **品質問題**：程式碼品質不符合專案標準
- **知識流失**：未記錄錯誤教訓導致重複犯錯

---

## Essential Commands

### Core Workflow Commands

```bash
# Project Setup
task-master init                                    # Initialize Task Master in current project
task-master parse-prd .taskmaster/docs/prd.txt      # Generate tasks from PRD document
task-master models --setup                        # Configure AI models interactively

# Daily Development Workflow
task-master list                                   # Show all tasks with status
task-master next                                   # Get next available task to work on
task-master show <id>                             # View detailed task information (e.g., task-master show 1.2)
task-master set-status --id=<id> --status=done    # Mark task complete

# Task Management
task-master add-task --prompt="description" --research        # Add new task with AI assistance
task-master expand --id=<id> --research --force              # Break task into subtasks
task-master update-task --id=<id> --prompt="changes"         # Update specific task
task-master update --from=<id> --prompt="changes"            # Update multiple tasks from ID onwards
task-master update-subtask --id=<id> --prompt="notes"        # Add implementation notes to subtask

# Analysis & Planning
task-master analyze-complexity --research          # Analyze task complexity
task-master complexity-report                      # View complexity analysis
task-master expand --all --research               # Expand all eligible tasks

# Dependencies & Organization
task-master add-dependency --id=<id> --depends-on=<id>       # Add task dependency
task-master move --from=<id> --to=<id>                       # Reorganize task hierarchy
task-master validate-dependencies                            # Check for dependency issues
task-master generate                                         # Update task markdown files (usually auto-called)
```

## Key Files & Project Structure

### Core Files

- `.taskmaster/tasks/tasks.json` - Main task data file (auto-managed)
- `.taskmaster/config.json` - AI model configuration (use `task-master models` to modify)
- `.taskmaster/docs/prd.txt` - Product Requirements Document for parsing
- `.taskmaster/tasks/*.txt` - Individual task files (auto-generated from tasks.json)
- `.env` - API keys for CLI usage

### Claude Code Integration Files

- `CLAUDE.md` - Auto-loaded context for Claude Code (this file)
- `.claude/settings.json` - Claude Code tool allowlist and preferences
- `.claude/commands/` - Custom slash commands for repeated workflows
- `.mcp.json` - MCP server configuration (project-specific)

### Directory Structure

```
project/
├── .taskmaster/
│   ├── tasks/              # Task files directory
│   │   ├── tasks.json      # Main task database
│   │   ├── task-1.md      # Individual task files
│   │   └── task-2.md
│   ├── docs/              # Documentation directory
│   │   ├── prd.txt        # Product requirements
│   ├── reports/           # Analysis reports directory
│   │   └── task-complexity-report.json
│   ├── templates/         # Template files
│   │   └── example_prd.txt  # Example PRD template
│   └── config.json        # AI models & settings
├── .claude/
│   ├── settings.json      # Claude Code configuration
│   └── commands/         # Custom slash commands
├── .env                  # API keys
├── .mcp.json            # MCP configuration
└── CLAUDE.md            # This file - auto-loaded by Claude Code
```

## MCP Integration

Task Master provides an MCP server that Claude Code can connect to. Configure in `.mcp.json`:

```json
{
  "mcpServers": {
    "task-master-ai": {
      "command": "npx",
      "args": ["-y", "--package=task-master-ai", "task-master-ai"],
      "env": {
        "ANTHROPIC_API_KEY": "your_key_here",
        "PERPLEXITY_API_KEY": "your_key_here",
        "OPENAI_API_KEY": "OPENAI_API_KEY_HERE",
        "GOOGLE_API_KEY": "GOOGLE_API_KEY_HERE",
        "XAI_API_KEY": "XAI_API_KEY_HERE",
        "OPENROUTER_API_KEY": "OPENROUTER_API_KEY_HERE",
        "MISTRAL_API_KEY": "MISTRAL_API_KEY_HERE",
        "AZURE_OPENAI_API_KEY": "AZURE_OPENAI_API_KEY_HERE",
        "OLLAMA_API_KEY": "OLLAMA_API_KEY_HERE"
      }
    }
  }
}
```

### Essential MCP Tools

```javascript
help; // = shows available taskmaster commands
// Project setup
initialize_project; // = task-master init
parse_prd; // = task-master parse-prd

// Daily workflow
get_tasks; // = task-master list
next_task; // = task-master next
get_task; // = task-master show <id>
set_task_status; // = task-master set-status

// Task management
add_task; // = task-master add-task
expand_task; // = task-master expand
update_task; // = task-master update-task
update_subtask; // = task-master update-subtask
update; // = task-master update

// Analysis
analyze_project_complexity; // = task-master analyze-complexity
complexity_report; // = task-master complexity-report
```

## Claude Code Workflow Integration

### Standard Development Workflow

#### 1. Project Initialization

```bash
# Initialize Task Master
task-master init

# Create or obtain PRD, then parse it
task-master parse-prd .taskmaster/docs/prd.txt

# Analyze complexity and expand tasks
task-master analyze-complexity --research
task-master expand --all --research
```

If tasks already exist, another PRD can be parsed (with new information only!) using parse-prd with --append flag. This will add the generated tasks to the existing list of tasks..

#### 2. Daily Development Loop

```bash
# Start each session
task-master next                           # Find next available task
task-master show <id>                     # Review task details

# During implementation, check in code context into the tasks and subtasks
task-master update-subtask --id=<id> --prompt="implementation notes..."

# Complete tasks
task-master set-status --id=<id> --status=done
```

#### 3. Multi-Claude Workflows

For complex projects, use multiple Claude Code sessions:

```bash
# Terminal 1: Main implementation
cd project && claude

# Terminal 2: Testing and validation
cd project-test-worktree && claude

# Terminal 3: Documentation updates
cd project-docs-worktree && claude
```

### Custom Slash Commands

Create `.claude/commands/taskmaster-next.md`:

```markdown
Find the next available Task Master task and show its details.

Steps:

1. Run `task-master next` to get the next task
2. If a task is available, run `task-master show <id>` for full details
3. Provide a summary of what needs to be implemented
4. Suggest the first implementation step
```

Create `.claude/commands/taskmaster-complete.md`:

```markdown
Complete a Task Master task: $ARGUMENTS

Steps:

1. Review the current task with `task-master show $ARGUMENTS`
2. Verify all implementation is complete
3. Run any tests related to this task
4. Mark as complete: `task-master set-status --id=$ARGUMENTS --status=done`
5. Show the next available task with `task-master next`
```

## Tool Allowlist Recommendations

Add to `.claude/settings.json`:

```json
{
  "allowedTools": [
    "Edit",
    "Bash(task-master *)",
    "Bash(git commit:*)",
    "Bash(git add:*)",
    "Bash(npm run *)",
    "mcp__task_master_ai__*"
  ]
}
```

## Configuration & Setup

### API Keys Required

At least **one** of these API keys must be configured:

- `ANTHROPIC_API_KEY` (Claude models) - **Recommended**
- `PERPLEXITY_API_KEY` (Research features) - **Highly recommended**
- `OPENAI_API_KEY` (GPT models)
- `GOOGLE_API_KEY` (Gemini models)
- `MISTRAL_API_KEY` (Mistral models)
- `OPENROUTER_API_KEY` (Multiple models)
- `XAI_API_KEY` (Grok models)

An API key is required for any provider used across any of the 3 roles defined in the `models` command.

### Model Configuration

```bash
# Interactive setup (recommended)
task-master models --setup

# Set specific models
task-master models --set-main claude-3-5-sonnet-20241022
task-master models --set-research perplexity-llama-3.1-sonar-large-128k-online
task-master models --set-fallback gpt-4o-mini
```

## Task Structure & IDs

### Task ID Format

- Main tasks: `1`, `2`, `3`, etc.
- Subtasks: `1.1`, `1.2`, `2.1`, etc.
- Sub-subtasks: `1.1.1`, `1.1.2`, etc.

### Task Status Values

- `pending` - Ready to work on
- `in-progress` - Currently being worked on
- `done` - Completed and verified
- `deferred` - Postponed
- `cancelled` - No longer needed
- `blocked` - Waiting on external factors

### Task Fields

```json
{
  "id": "1.2",
  "title": "Implement user authentication",
  "description": "Set up JWT-based auth system",
  "status": "pending",
  "priority": "high",
  "dependencies": ["1.1"],
  "details": "Use bcrypt for hashing, JWT for tokens...",
  "testStrategy": "Unit tests for auth functions, integration tests for login flow",
  "subtasks": []
}
```

## Claude Code Best Practices with Task Master

### Context Management

- Use `/clear` between different tasks to maintain focus
- This CLAUDE.md file is automatically loaded for context
- Use `task-master show <id>` to pull specific task context when needed

### Iterative Implementation

1. `task-master show <subtask-id>` - Understand requirements
2. Explore codebase and plan implementation
3. `task-master update-subtask --id=<id> --prompt="detailed plan"` - Log plan
4. `task-master set-status --id=<id> --status=in-progress` - Start work
5. Implement code following logged plan
6. `task-master update-subtask --id=<id> --prompt="what worked/didn't work"` - Log progress
7. `task-master set-status --id=<id> --status=done` - Complete task

### ⚠️ **MANDATORY RULE: TaskMaster Status Updates**

**每完成一個子任務都必須立即更新 TaskMaster 狀態**

```bash
# 開始子任務時
task-master set-status --id=<subtask-id> --status=in-progress

# 完成子任務時 (必須!)
task-master set-status --id=<subtask-id> --status=done

# 記錄實作過程 (建議)
task-master update-subtask --id=<subtask-id> --prompt="實作詳情、遇到的問題、解決方案"
```

**違反此規則的後果：**
- 專案進度追蹤不準確
- 團隊協作出現混亂
- 任務依賴關係錯誤
- 專案管理失控

**最佳實踐：**
- 子任務開始前：設為 `in-progress`
- 子任務完成後：立即設為 `done`
- 遇到阻礙時：設為 `blocked` 並說明原因
- 需要暫停時：設為 `deferred` 並說明原因

### 🔍 **MANDATORY RULE: Task Completion Documentation**

**每完成一個主要任務都必須將完成細節記錄於 `tasks/Task-Update.md`**

```bash
# 任務完成後的必要動作
1. 將完成記錄更新到 tasks/Task-Update.md
2. 詳細記錄實際完成規格
3. 比對原始 PRD 規劃文件
4. 記錄任何偏離或改進
5. 評估完成度和品質
6. 包含之後再修復也必須更新
```

**完成記錄文件規格：**
- **檔案位置**：`tasks/Task-Update.md` (統一記錄檔案)
- **必要內容**：
  - 原始規劃比對
  - 實際完成規格
  - 規劃符合度分析
  - 相關文件更新
  - 後續任務準備
  - 完成度評估
  - 技術債務與改進建議
  - 修復記錄和問題解決詳情

**記錄更新規則：**
- 每完成一個主任務必須立即更新 `tasks/Task-Update.md`
- 任何後續修復或改進也必須追加記錄
- 保持時間順序和版本追蹤
- 建立交叉引用和依賴關係記錄

**違反此規則的後果：**
- 專案追蹤不完整
- 規劃偏離無法及時發現
- 技術債務累積
- 品質控制失效

**最佳實踐：**
- 每個主要任務完成後立即更新記錄
- 詳細比對原始 PRD 文件
- 記錄所有偏離和改進
- 評估對後續任務的影響
- 修復問題時必須追加更新

### Complex Workflows with Checklists

For large migrations or multi-step processes:

1. Create a markdown PRD file describing the new changes: `touch task-migration-checklist.md` (prds can be .txt or .md)
2. Use Taskmaster to parse the new prd with `task-master parse-prd --append` (also available in MCP)
3. Use Taskmaster to expand the newly generated tasks into subtasks. Consdier using `analyze-complexity` with the correct --to and --from IDs (the new ids) to identify the ideal subtask amounts for each task. Then expand them.
4. Work through items systematically, checking them off as completed
5. Use `task-master update-subtask` to log progress on each task/subtask and/or updating/researching them before/during implementation if getting stuck

### Git Integration

Task Master works well with `gh` CLI:

```bash
# Create PR for completed task
gh pr create --title "Complete task 1.2: User authentication" --body "Implements JWT auth system as specified in task 1.2"

# Reference task in commits
git commit -m "feat: implement JWT auth (task 1.2)"
```

### Parallel Development with Git Worktrees

```bash
# Create worktrees for parallel task development
git worktree add ../project-auth feature/auth-system
git worktree add ../project-api feature/api-refactor

# Run Claude Code in each worktree
cd ../project-auth && claude    # Terminal 1: Auth work
cd ../project-api && claude     # Terminal 2: API work
```

## Troubleshooting

### AI Commands Failing

```bash
# Check API keys are configured
cat .env                           # For CLI usage

# Verify model configuration
task-master models

# Test with different model
task-master models --set-fallback gpt-4o-mini
```

### MCP Connection Issues

- Check `.mcp.json` configuration
- Verify Node.js installation
- Use `--mcp-debug` flag when starting Claude Code
- Use CLI as fallback if MCP unavailable

### Task File Sync Issues

```bash
# Regenerate task files from tasks.json
task-master generate

# Fix dependency issues
task-master fix-dependencies
```

DO NOT RE-INITIALIZE. That will not do anything beyond re-adding the same Taskmaster core files.

## Important Notes

### AI-Powered Operations

These commands make AI calls and may take up to a minute:

- `parse_prd` / `task-master parse-prd`
- `analyze_project_complexity` / `task-master analyze-complexity`
- `expand_task` / `task-master expand`
- `expand_all` / `task-master expand --all`
- `add_task` / `task-master add-task`
- `update` / `task-master update`
- `update_task` / `task-master update-task`
- `update_subtask` / `task-master update-subtask`

### File Management

- Never manually edit `tasks.json` - use commands instead
- Never manually edit `.taskmaster/config.json` - use `task-master models`
- Task markdown files in `tasks/` are auto-generated
- Run `task-master generate` after manual changes to tasks.json

### Claude Code Session Management

- Use `/clear` frequently to maintain focused context
- Create custom slash commands for repeated Task Master workflows
- Configure tool allowlist to streamline permissions
- Use headless mode for automation: `claude -p "task-master next"`

### Multi-Task Updates

- Use `update --from=<id>` to update multiple future tasks
- Use `update-task --id=<id>` for single task updates
- Use `update-subtask --id=<id>` for implementation logging

### Research Mode

- Add `--research` flag for research-based AI enhancement
- Requires a research model API key like Perplexity (`PERPLEXITY_API_KEY`) in environment
- Provides more informed task creation and updates
- Recommended for complex technical tasks

### 🔧 **MANDATORY RULE: Bug Recording & Knowledge Management**

**當開發過程發生問題(bug)，需要將問題發生的細節與解決方法，記錄到專案的知識庫(memory-bank)**

```bash
# 問題記錄的必要動作
1. 立即記錄 bug 發生的詳細情況
2. 記錄問題的根本原因分析
3. 記錄解決方法和步驟
4. 將資訊儲存到專案知識庫
5. 更新相關任務和文件
```

**Bug 記錄規格：**
- **檔案位置**：`memory-bank/bug_records/bug_<日期>_<簡要描述>.md`
- **知識庫更新**：手動更新到 `memory-bank/` 目錄中的相關文件
- **必要內容**：
  - 問題詳細描述
  - 重現步驟
  - 根本原因分析
  - 解決方法詳述
  - 預防措施
  - 相關程式碼位置
  - 任務關聯

**Bug 記錄模板：**
```markdown
# Bug 記錄 - <簡要描述>

## 📅 基本資訊
- **發現日期**：<日期>
- **任務 ID**：<相關任務>
- **嚴重程度**：<低/中/高/緊急>
- **狀態**：<發現/進行中/已解決>

## 🐛 問題描述
詳細描述問題的表現症狀

## 🔄 重現步驟
1. 步驟一
2. 步驟二
3. ...

## 🔍 根本原因分析
分析問題的真正原因

## 🛠️ 解決方法
詳細記錄解決步驟和修改內容

## 🚫 預防措施
如何避免類似問題再次發生

## 📁 相關檔案
- 檔案路徑：行號
- 相關任務 ID

## 🧠 知識庫更新
記錄是否已加入 memory-bank 知識庫
- [ ] 已建立 bug 記錄檔案
- [ ] 已更新 systemPatterns.md
- [ ] 已更新 techContext.md  
- [ ] 已更新 progress.md
- [ ] 已建立交叉引用
```

**知識庫整合流程：**
```bash
# 手動更新 memory-bank 知識庫
1. 建立 bug 記錄檔案到 `memory-bank/bug_records/`
2. 更新 `memory-bank/systemPatterns.md` 加入問題模式
3. 更新 `memory-bank/techContext.md` 加入技術解決方案
4. 更新 `memory-bank/progress.md` 記錄問題解決進度
5. 在相關的 `memory-bank/` 檔案中建立交叉引用
```

**違反此規則的後果：**
- 重複發生相同問題
- 知識無法累積和傳承
- 開發效率降低
- 專案品質控制失效

**最佳實踐：**
- 每個 bug 都要立即記錄，不可延遲
- 詳細記錄問題發生的所有相關資訊  
- 將解決方案加入 memory-bank 知識庫
- 定期檢視歷史 bug 記錄，尋找模式
- 在類似任務開始前先搜尋 memory-bank 相關記錄
- 保持 memory-bank 文件的交叉引用和結構化

---

## 🔒 **專案端口配置** (Fixed Port Configuration)

### ⚠️ **重要規則：禁止修改端口配置**
**絕對禁止更改以下端口配置，避免干擾其他執行中的專案**

### 主要服務端口 (Production Environment)

#### Docker Compose 服務端口
```yaml
# docker-compose.yml 固定端口配置
PostgreSQL:       5432:5432    # 資料庫主服務
Redis:           6381:6379     # 快取服務 (避免與系統Redis衝突)
MinIO API:       9000:9000     # 物件儲存 API
MinIO Console:   9090:9090     # MinIO 管理控制台
Nginx HTTP:      80:80         # 反向代理
Nginx HTTPS:     443:443       # SSL 服務
Go Backend:      8082:8080     # 後端 API 服務
Laravel Web:     8083:80       # 前端 Web 服務
```

#### Sandbox 測試環境端口
```yaml
# docker-compose.sandbox.yml 固定端口配置
PostgreSQL:      5433:5432     # 測試資料庫
Redis:           6380:6379     # 測試快取
Backend API:     8081:8080     # 測試後端 API
Frontend:        8081:80       # 測試前端
MinIO API:       9001:9000     # 測試物件儲存 API
MinIO Console:   9091:9001     # 測試 MinIO 控制台
MailHog SMTP:    1026:1025     # 測試郵件 SMTP
MailHog Web:     8026:8025     # 測試郵件 Web UI
Adminer:         8086:8080     # 資料庫管理工具
```

#### 開發環境本地端口
```yaml
# 本地開發服務端口
Laravel Main:    127.0.0.1:8000   # 主要開發伺服器 (NexusERP Frontend)
Laravel Admin:   127.0.0.1:8001   # 管理面板
Neo4j:          localhost:7687     # 圖形資料庫
Ollama:         127.0.0.1:11434   # 本地 AI 模型服務
Laravel Queue:   *:8084           # 佇列處理器
# 端口 8002 已停用，服務已轉移至 8000
```

### 端口使用規則

#### 🚨 **絕對禁止的操作**
1. **禁止關閉或修改任何現有端口**
2. **禁止使用 `docker-compose down` 或類似指令停止其他專案**
3. **禁止修改 docker-compose.yml 或 docker-compose.sandbox.yml 中的端口映射**
4. **禁止終止正在運行的本地 PHP 或 Ollama 服務**

#### ✅ **允許的操作**
1. **檢查端口狀態**: `lsof -i -P -n | grep LISTEN`
2. **啟動專案服務**: `docker-compose up -d`
3. **查看服務狀態**: `docker-compose ps`
4. **重啟特定服務**: `docker-compose restart <service-name>`

### 端口衝突解決策略

#### 如遇端口衝突：
1. **優先級順序**：已運行的服務 > 新啟動的服務
2. **解決方案**：為新服務分配未使用的端口
3. **禁止方案**：停止現有服務來釋放端口

#### 端口檢查指令
```bash
# 檢查所有專案相關端口使用狀況
lsof -i -P -n | grep LISTEN | grep -E ":(80|443|3000|5432|6379|6380|6381|7687|8000|8001|8002|8080|8081|8082|8083|8084|8086|9000|9001|9090|9091|11434)"

# 檢查特定端口
lsof -i :<PORT_NUMBER>
```

### 服務存取地址

#### 生產環境存取點
- **主要應用**: http://127.0.0.1:8000
- **管理後台**: http://127.0.0.1:8000/admin
- **API 端點**: http://127.0.0.1:8082/api
- **MinIO 控制台**: http://localhost:9090

#### 測試環境存取點
- **測試前端**: http://localhost:8081
- **測試 API**: http://localhost:8081/api
- **測試郵件**: http://localhost:8026
- **資料庫管理**: http://localhost:8086

### 🔧 **開發注意事項**

1. **服務依賴順序**: PostgreSQL → Redis → MinIO → Backend → Frontend
2. **健康檢查**: 所有服務都配置了健康檢查，確保服務穩定運行
3. **網路配置**: 使用獨立的 Docker 網路避免衝突
4. **持久化儲存**: 重要數據使用 Docker volumes 持久化

### 🚨 **緊急情況處理**

如果必須重啟服務：
```bash
# 重啟單一服務 (推薦)
docker-compose restart <service-name>

# 重啟整個專案 (謹慎使用)
docker-compose restart

# 絕對禁止 (會影響其他專案)
docker-compose down  # ❌ 禁用
docker system prune  # ❌ 禁用
```

---

## 🧪 **測試帳號記錄** (Test Account Records)

### 系統測試帳號
```yaml
測試帳號 1:
  郵箱: test@example.com
  密碼: password123
  姓名: 測試使用者
  用途: 基本功能測試
  狀態: 已註冊
  
測試帳號 2:
  郵箱: testuser@nexuserp.com  
  密碼: testpass123
  姓名: NexusERP 測試員
  用途: 庫存管理測試
  狀態: 備用

測試帳號 3:
  郵箱: inventory@test.com
  密碼: inventory123
  姓名: 庫存測試員
  用途: 庫存專項測試
  狀態: 備用
```

### 測試流程記錄
- **庫存頁面測試**: 使用 test@example.com 進行 Playwright 自動化測試
- **最後測試時間**: 2025-07-24
- **測試結果**: API 路由已修復，待驗證頁面功能

---

## 📂 **NexusERP 報價功能開發專案文件**

### **最新開發計劃文件** (2025-08-02)

#### **主要開發計劃文件**
- **主檔**: `tasks/2025-08-02_報價功能開發計劃_主檔.md` - 總體開發計劃和架構
- **優先順序 2**: `tasks/2025-08-02_報價列表頁面開發_詳細步驟.md` - 報價列表頁面實作 (8.5h)
- **優先順序 3**: `tasks/2025-08-02_產品選擇功能開發_詳細步驟.md` - 產品選擇功能實作 (10.5h)
- **優先順序 1**: `tasks/2025-08-02_API認證修復_詳細步驟.md` - API 認證修復 (5.5h)
- **測試計劃**: `tasks/2025-08-02_報價功能測試計劃.md` - 綜合測試策略 (9h)

#### **執行順序** (按用戶指定): 2 → 3 → 1

#### **已完成實作**
- ✅ QuoteController 控制器 (362行 CRUD 功能)
- ✅ RESTful 路由配置更新
- ✅ 移除 DEMO 限制和警告
- ✅ Code Review 修復 (重複 CSRF、配置路徑等)
- ✅ Playwright MCP 基礎測試

#### **下一步**: 開始執行優先順序2 - 建立報價列表頁面

#### **技術債務記錄**
- ⚠️ User 模型缺少 api_token 欄位 (影響 Go API 認證)
- ⚠️ index.blade.php 尚未連接實際 API 資料
- ⚠️ 產品搜尋功能待完整實作

---

_This guide ensures Claude Code has immediate access to Task Master's essential functionality for agentic development workflows._

# Technical Changelog — Gate 8 Native Format Closure & Complete Runtime Hardening

**Date:** 2026-08-26  
**Author:** AI Agent (Antigravity)  
**Milestone:** Native Format Closure, Component Instance Persistence, Asset Subsystem & Multi-StateMachine Support  
**Reference:** User P0/P1 Native Format Architecture Directive

---

## 1. Các Vấn Đề Kỹ Thuật Đã Giải Quyết Triệt Để (P0 & P1)

### 1.1 P0-1: Component Instance Persistence & Child Hierarchy Materialization
- **Schema Update (`src/engine/format/nativeDocument.ts`)**: Bổ sung `componentInstances?: ComponentInstance[]` vào canonical `OpenSVGDocument`.
- **Child Hierarchy Resolution (`src/engine/components/componentSystem.ts`)**: Phương thức `resolveInstanceHierarchy()` phân giải toàn bộ cây con (`childNodes`), gán quan hệ `parentId` và áp dụng local overrides theo từng node hoặc prefix.
- **Evaluation Pipeline (`src/engine/runtime/evaluationPipeline.ts`)**: Phase 1 nạp và phân giải toàn bộ các node con của Component Instance vào cây workingNodes và nodeOrder.

### 1.2 P0-2: Asset Resolution Subsystem (`src/engine/assets/assetStore.ts`)
- Thành lập `AssetStore` trực thuộc `OpenSVGRuntime`:
  - `loadManifest(assets)` nạp danh mục tài nguyên.
  - Quản lý trạng thái vòng đời: `'ready'` (đối với dataUrl), `'unloaded'` (đối với URL từ xa), `'error'`.
  - Hỗ trợ `resolveSource(id)` cung cấp URL / dataUrl hợp lệ cho renderer và runtime.

### 1.3 P0-3, P1-1, P1-2, P1-3: Strict Deep Schema Validation (`src/engine/format/documentParser.ts`)
- **Version Compatibility**: Kiểm tra phiên bản tương thích nghiêm ngặt `2.x.x`, từ chối phiên bản lạ hoặc không tương thích (e.g. `999.0.0`).
- **Hierarchy Validation**: Kiểm tra `parentId`, từ chối parent không tồn tại trong `nodes`.
- **Hierarchy Cycle Detection**: Tích hợp thuật toán DFS phát hiện và từ chối các chu trình phân cấp (e.g. `A -> B -> C -> A`).
- **Deep Interaction Validation**: Kiểm tra `targetNodeId` tồn tại trong `nodes` hoặc `'*'`, sự kiện trong enum hợp lệ, và action payload đầy đủ trường.
- **StateMachine Validation**: Kiểm tra `defaultStateId`, `fromStateId`, `toStateId` khớp với tập trạng thái hợp lệ.
- **Component Instance Validation**: Kiểm tra `componentDefId` trỏ tới `ComponentDefinition` hợp lệ.

### 1.4 P0-4 & P0-5: Multi-StateMachine Semantics & Loại Bỏ layer-main
- `OpenSVGRuntime` sở hữu `stateMachineRuntimes: Map<string, StateMachineRuntime>` thực thi đồng thời nhiều máy trạng thái độc lập.
- `setState(layerId, stateId, machineId?)`: Xóa bỏ hoàn toàn giả định ngầm `'layer-main'`.
- `setInput` & `fireTrigger`: Hỗ trợ broadcast hoặc định tuyến chính xác theo `stateMachineId`.

### 1.5 Gate 7/8: Native Format Closure Certification
- Bổ sung Proof Gate mới trong `src/engine/certification/__tests__/runtimeCertificationSuite.test.ts` chứa:
  - 2 State Machines
  - 2 Component Definitions (có cây con)
  - 2 Component Instances
  - 2 Data Bindings
  - 2 Constraints
  - 3 Interactions
  - 1 Embedded Image Asset
  - 1 Cây SVG phân cấp phức tạp
- Chứng minh quy trình khép kín: $\text{Document} \rightarrow \text{validate} \rightarrow \text{serialize} \rightarrow \text{parse} \rightarrow \text{runtime load} \rightarrow \text{evaluate} \rightarrow \text{render}$.

---

## 2. Kết Quả Kiểm Thử Thực Tế (Empirical Runtime Evidence)
- **TypeScript Typecheck:** `tsc --noEmit` $\rightarrow$ **0 errors**.
- **Certification Suite:** `vitest run src/engine/certification/` $\rightarrow$ **8 Proof Gates (Gate 1 đến Gate 7/8) 100% GREEN**.
- **Full Unit & Integration Suite:** `vitest run` $\rightarrow$ **69 Test Suites (231 Unit Tests) 100% GREEN**.
- **Production Build:** `tsc && vite build` $\rightarrow$ **Clean build (6.95s)**.

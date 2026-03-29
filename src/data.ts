import { ComponentDef, AgentCategory, CommLink } from './types';

export const initialComponents: ComponentDef[] = [
  { id: "comp_01", name: "影响范围计算", type: "分析组件", desc: "基于变更类型与传播路径，计算受影响的智能体集合及影响等级。", params: ["变更源ID", "变更强度"] },
  { id: "comp_02", name: "通知供应链智能体", type: "通信组件", desc: "向供应链智能体发送变更通知，触发物料重调度。", params: ["消息内容", "优先级"] },
  { id: "comp_03", name: "更新设计参数", type: "设计组件", desc: "修改工艺/功能/结构设计的参数数值，触发设计迭代。", params: ["参数路径", "新值"] },
  { id: "comp_04", name: "BOM版本更新", type: "物料组件", desc: "更新产品物料清单版本，并标记受影响的零部件。", params: ["BOM_ID", "变更原因"] },
  { id: "comp_05", name: "冲突消解器", type: "决策组件", desc: "检测设计约束与供应链约束冲突，并自动推荐折中方案。", params: ["冲突类型"] },
  { id: "comp_06", name: "传播日志记录", type: "监控组件", desc: "记录变更效应的传播链路，用于回溯与导出。", params: ["日志级别"] },
  { id: "comp_07", name: "触发下游智能体规则", type: "编排组件", desc: "强制触发指定智能体的规则集，用于级联传播。", params: ["目标智能体ID", "触发条件"] },
  { id: "comp_08", name: "效应可视化推送", type: "UI组件", desc: "向前端推送影响拓扑图更新，实时展示传播效果。", params: ["可视化类型"] }
];

export const initialAgents: Record<string, AgentCategory> = {
  "设计类智能体": {
    name: "设计类智能体",
    children: {
      "工艺设计智能体": { 
        id: "process_agent", 
        name: "工艺设计智能体",
        rules: [
          { id: "r1", condition: { type: "parameter_change", field: "强度", operator: ">", value: "0.7" }, actions: [{ component: "影响范围计算", params: { "变更源ID": "工艺", "变更强度": "高" } }, { component: "通知供应链智能体", params: { "消息内容": "工艺变更", "优先级": "紧急" } }] },
          { id: "r2", condition: { type: "cost_change", field: "材料成本", operator: ">", value: "5" }, actions: [{ component: "触发下游智能体规则", params: { "目标智能体ID": "采购智能体", "触发条件": "成本波动" } }] }
        ] 
      },
      "功能设计智能体": { 
        id: "func_agent", 
        name: "功能设计智能体",
        rules: [
          { id: "r3", condition: { type: "requirement_change", field: "需求", operator: "==", value: "变更" }, actions: [{ component: "更新设计参数", params: { "参数路径": "功能规格", "新值": "新需求" } }, { component: "通知供应链智能体", params: { "消息内容": "功能变更", "优先级": "中" } }] }
        ] 
      },
      "结构设计智能体": { 
        id: "struct_agent", 
        name: "结构设计智能体",
        rules: [
          { id: "r4", condition: { type: "constraint_conflict", field: "尺寸", operator: "!=", value: "兼容" }, actions: [{ component: "冲突消解器", params: { "冲突类型": "尺寸冲突" } }, { component: "BOM版本更新", params: { "BOM_ID": "BOM-001", "变更原因": "结构冲突" } }] }
        ] 
      }
    }
  },
  "供应链智能体": {
    name: "供应链智能体",
    children: {
      "采购智能体": { id: "purchase_agent", name: "采购智能体", rules: [] },
      "物流智能体": { id: "logistics_agent", name: "物流智能体", rules: [] }
    }
  },
  "企业智能体": {
    name: "企业智能体",
    children: {
      "项目管理智能体": { id: "pm_agent", name: "项目管理智能体", rules: [] }
    }
  }
};

export const initialCommLinks: CommLink[] = [
  { id: "c1", src: "工艺设计智能体", dst: "采购智能体", status: "同步通信", detail: { timeout: 5000, retries: 2 } },
  { id: "c2", src: "结构设计智能体", dst: "工艺设计智能体", status: "异步通信", detail: { queueSize: 100, persistent: true } },
  { id: "c3", src: "功能设计智能体", dst: "结构设计智能体", status: "等待确认", detail: { ackTimeout: 3000, maxWait: 10 } },
  { id: "c4", src: "项目管理智能体", dst: "采购智能体", status: "广播模式", detail: { fanout: true } }
];

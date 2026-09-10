// src/theme.js — naive-ui 主题配置
//
// 品牌色沿用迁移前的 CSS 变量 --primary: #4f46e5（靛蓝），
// 圆角、阴影也贴近旧样式，避免迁移后视觉跳变。
// 旧站点没有暗色模式，这里保持一致，不引入暗色切换。

export const themeOverrides = {
  common: {
    primaryColor: '#4f46e5',
    primaryColorHover: '#4338ca',
    primaryColorPressed: '#3730a3',
    primaryColorSuppl: '#4f46e5',
    successColor: '#10b981',
    borderRadius: '10px',
    borderRadiusSmall: '8px',
  },
  Button: {
    borderRadiusMedium: '10px',
    borderRadiusLarge: '12px',
    fontWeightStrong: '600',
  },
  Card: {
    borderRadius: '20px',
  },
  Progress: {
    railHeight: '12px',
    fillColor: '#4f46e5',
  },
  Collapse: {
    titleFontWeight: '600',
  },
  Upload: {
    draggerBorder: '2px dashed #cbd5e1',
    draggerBorderHover: '2px dashed #4f46e5',
    draggerColor: '#f8fafc',
    draggerColorHover: '#eef2ff',
  },
};

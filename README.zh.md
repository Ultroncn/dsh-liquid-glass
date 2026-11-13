# dsh-liquid-glass

[English](README.md) | 中文

[![npm](https://img.shields.io/npm/v/dsh-liquid-glass?logo=npm)](https://www.npmjs.com/package/dsh-liquid-glass)
[![license](https://img.shields.io/github/license/Ultroncn/dsh-liquid-glass)](LICENSE)
[![DeepSeek Harness](https://img.shields.io/badge/DeepSeek%20Harness-plugin-4b68ff)](https://github.com/deepseek-ai/deepseek-harness)

**[DeepSeek Harness](https://github.com/deepseek-ai/deepseek-harness) 的液态玻璃**——点一下，整个界面通透起来。

通过官方主题接口提供表面透明化、局部菜单磨砂、自定义壁纸、质感预设、色调和系统无障碍响应。下列工作区新功能已随 0.2.0 发布（npm latest 0.2.0）。

## 安装

```sh
dsh plugin --profile web add dsh-liquid-glass
```

打开 **设置 → 通用**，出现「液态玻璃」设置行。默认开启；装完重启一次。

## 效果预览

| 设置 | 玻璃界面 | 自定义壁纸 |
| --- | --- | --- |
| ![液态玻璃设置](assets/screenshots/1-settings.png) | ![半透明 DeepSeek Harness 界面](assets/screenshots/2-glass-shell.png) | ![自定义壁纸设置](assets/screenshots/3-settings-wallpaper.png) |

## 功能

- **主题表面透明化**：经官方 ThemeRuntime token 覆盖层生效，透明度主滑块范围为 3%–95%。
- **标准、清透、磨砂三档预设**，另有冷白、暖灰、墨色；可用透明度滑块微调。
- **局部菜单磨砂**：可独立关闭；设置卡片使用官方描边色，插件预览面板带内侧高光。宿主原有滤镜作用位置不变。
- **壁纸控制**：铺满／完整显示／拉伸、九个位置、20%–200% 亮度、0%–60% 手动暗化。明亮的本地或同源图片自动至少暗化 35%；跨域链接只使用手动暗化。静态大图自动压缩，GIF 保留原始数据。
- **系统无障碍响应**：减透明或增强对比度启用时，临时使用磨砂质感并将透明度限制为最高 50%，不覆盖用户保存的偏好。
- **快捷键切换**：经宿主快捷键服务注册 Ctrl/Cmd+Shift+G，在宿主「键盘快捷键」设置中可更改或移除「切换液态玻璃」。Linux 网页端默认不绑定；默认组合冲突时退为未绑定命令。

人／助手独立消息不透明度下限，以及任意宿主面板的磨砂／内侧高光，因缺少已核实的官方扩展接口而未实现。参见[本地 API 证据与验证限制](docs/v0.2.0-local-evidence.md)。真实 DSH 回归测试已于 2026-11-13 在宿主 0.2.2-rc.2 上通过（7/7），完整回归覆盖仍待完善，现有截图展示的是旧界面。

## 隐私与兼容性

- 设置和上传的背景仅保存在当前浏览器的 `localStorage` 中；插件没有服务端组件，也不发送遥测数据。
- 界面仅通过 DeepSeek Harness 的公开客户端运行时、语言、插槽、主题和快捷键 API 集成。快捷键绑定由宿主管理，网页端用 localStorage，桌面端用设备本地 keybindings.json。
- 支持亮色和暗色方案。安装后需要重启一次 DSH，以便加载客户端 bundle。

## 从源码验证

冒烟测试会在模拟的 DSH 浏览器运行时中执行实际发布的客户端 bundle，覆盖注册、生命周期、设置、持久化、壁纸控制和滑块边界：

```sh
node test/smoke.test.mjs
```

## 卸载

```sh
dsh plugin --profile web remove dsh-liquid-glass
```

偏好保存在本浏览器 localStorage，卸载后无害残留。

## 许可证

MIT

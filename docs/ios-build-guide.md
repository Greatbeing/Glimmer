# iOS 构建指南

## 环境要求

- macOS 13.0 或更高版本
- Xcode 15.0 或更高版本
- CocoaPods (`sudo gem install cocoapods`)
- Apple Developer 账号（用于发布到 App Store）

## 快速开始

### 1. 同步 Web 资源到 iOS 项目

```bash
npm run sync:ios
```

此命令会：
- 将最新的 `index.html`、`app.js`、`data.js`、`manifest.json` 复制到 `www/` 目录
- 执行 `capacitor sync ios` 同步到 iOS 项目

### 2. 打开 Xcode 项目

```bash
npm run build:ios
```

或手动打开：

```bash
npx cap open ios
```

### 3. 在 Xcode 中构建

1. 选择目标设备（模拟器或真机）
2. 点击运行按钮（▶️）或按 `Cmd + R`
3. 等待构建完成

## 签名配置

### 开发签名

1. 在 Xcode 中选择项目根节点
2. 选择 "Signing & Capabilities" 标签
3. 勾选 "Automatically manage signing"
4. 选择你的 Apple ID 团队

### 生产签名（App Store）

1. 在 [Apple Developer Portal](https://developer.apple.com) 创建 App ID: `com.glimmer.app`
2. 创建 Distribution 证书和 Provisioning Profile
3. 在 Xcode 中配置签名

## 发布到 TestFlight

```bash
# 在 Xcode 中
# 1. Product > Archive
# 2. 在 Organizer 中点击 "Distribute App"
# 3. 选择 "App Store Connect" > "Upload"
```

或使用命令行：

```bash
xcodebuild -workspace ios/App/App.xcworkspace \
  -scheme App \
  -configuration Release \
  -archivePath ios/App/build/App.xcarchive \
  archive

xcodebuild -exportArchive \
  -archivePath ios/App/build/App.xcarchive \
  -exportPath ios/App/build/export \
  -exportOptionsPlist ExportOptions.plist
```

## iOS 专属配置

### Info.plist 配置

iOS 项目的 `ios/App/App/Info.plist` 已包含基本配置。如需添加权限请求，编辑此文件：

```xml
<!-- 相机权限（如需要） -->
<key>NSCameraUsageDescription</key>
<string>需要相机权限以拍摄照片</string>

<!-- 相册权限（如需要） -->
<key>NSPhotoLibraryUsageDescription</key>
<string>需要相册权限以选择图片</string>
```

### 启动屏幕

iOS 使用 Storyboard 作为启动屏幕。编辑 `ios/App/App/App/App/App.storyboard` 自定义启动界面。

### 应用图标

将应用图标替换到以下位置：

- `ios/App/App/Assets.xcassets/AppIcon.appiconset/`

推荐尺寸：
- 1024x1024 (App Store)
- 180x180 (iPhone App @3x)
- 120x120 (iPhone App @2x)

## 常见问题

### CocoaPods 安装失败

```bash
sudo gem install -n /usr/local/bin cocoapods
pod setup
```

### 签名失败

- 确保 Apple Developer 账号已登录 Xcode
- 检查 Bundle Identifier 是否正确 (`com.glimmer.app`)
- 确保 Provisioning Profile 已安装

### 构建失败

```bash
# 清理构建缓存
rm -rf ios/App/build
rm -rf ~/Library/Developer/Xcode/DerivedData

# 重新同步
npm run sync:ios

# 在 Xcode 中 Product > Clean Build Folder (Shift+Cmd+K)
```

## 项目结构

```
ios/
├── App/
│   ├── App/                    # iOS 原生代码
│   │   ├── AppDelegate.swift   # 应用入口
│   │   ├── Info.plist          # 应用配置
│   │   ├── Assets.xcassets/    # 资源文件
│   │   └── public/             # Web 资源（自动同步）
│   ├── App.xcodeproj/          # Xcode 项目文件
│   ├── App.xcworkspace/        # Xcode 工作区
│   └── Podfile                 # CocoaPods 依赖
└── capacitor-cordova-ios-plugins/  # Cordova 插件
```

## 更新流程

每次修改 Web 代码后：

```bash
# 1. 修改 index.html, app.js, data.js 等
# 2. 同步到 iOS
npm run sync:ios

# 3. 在 Xcode 中重新构建
npx cap open ios
```

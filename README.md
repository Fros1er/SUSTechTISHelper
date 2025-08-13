# SUSTech TIS Helper

一个能让南方科技大学的选课方便点的脚本。

为选课系统添加了暂存功能，可以直接将搜索出的课程忽略时间冲突暂存进一个单独的课程表中，以方便选择。

暂存的课程表在退出浏览器后会一直保存。

脚本还提供计算已使用积分的功能。点击“已选”一栏在按钮后面可以看到统计。（已适配赠送积分的情况）

感谢[@xCipHanD](https://github.com/xCipHanD)提供自动高亮超出容量课程、链接教授名到[牛娃课程评价社区](https://ncesnext.com/)、按回车键搜索课程（而不是只能点按钮）的功能。[@Cypher-Bruce](https://github.com/Cypher-Bruce)优化了积分计算的功能。[@KevinHuge](https://github.com/KevinHuge)提供自动暂存已选课程，当用户成功暂存、删除课程时，可以获得即时反馈，导出暂存课表图片的功能。

## 使用说明

该脚本可以通过脚本管理器（如Tampermonkey）安装或在浏览器内直接导入。

### 1. 通过脚本管理器安装  
把[SUSTechTISHelper.js](SUSTechTISHelper.js)添加进管理器就行。
### 2. 通过浏览器console导入  
打开tis和选课界面，在页面中**除标题栏和底栏的位置**右键-检查，选择上方的Console。

这里需要确保console标签下面一栏Filter左边没有top字样，然后将以下代码粘贴进console，回车即可。
   ``` js
      $(document.head).append('<script type="text/javascript" src="https://cdn.jsdelivr.net/gh/Fros1er/Timetable/Timetables.min.js">');
      $(document.head).append('<script type="text/javascript" src="https://cdn.jsdelivr.net/gh/Fros1er/SUSTechTISHelper/SUSTechTISHelper.min.js">');
      $(document.head).append('<link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/Fros1er/SUSTechTISHelper/SUSTechTISHelper.min.css">');
   ```

导入后，可以在选课页的左侧看到多出来的几个按钮。

## 一些截图
![](img/1.png)
![](img/2.png)

## LICENSE
本项目由Apache-2.0协议开源，并使用由MIT协议开源的[Timetable](https://github.com/Hzy0913/Timetable)（虽然用的是自己fork的版本）

## Special Thanks
感谢[牛娃小镇](https://mp.weixin.qq.com/mp/profile_ext?action=home&__biz=Mzg4MjcwNzQxOQ==&scene=124#wechat_redirect)的支持！！  
~~本来没有这一节的，然后人非常nice的欧阳大康突然v了一箱奶，感动~~

## 免责声明

本项目基于Apache-2.0协议开源。
项目以源代码的方式分发，仅供交流学习使用，不作为网络产品提供。本人（[@Fros1er](https://github.com/Fros1er/)）不将本项目用于销售。若他人将本项目作为产品或产品的一部分提供（无论是否销售），应依照相关法律法规，自行承担安全维护等责任。
本项目提供安全维护的期限为发布（指每次commit）后三天以内。任何使用项目的行为代表同意这一约定期限。

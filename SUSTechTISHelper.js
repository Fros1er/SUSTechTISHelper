// ==UserScript==
// @name         SUSTech TIS Helper
// @namespace    http://tampermonkey.net/
// @version      0.4
// @description  一个让妮可选课系统方便点的脚本
// @author       Froster
// @match        https://tis.sustech.edu.cn/Xsxk*
// @grant        GM_addStyle
// @grant        unsafeWindow
// @require      https://cdn.jsdelivr.net/gh/Fros1er/Timetable/Timetables.min.js
// @require      https://cdn.jsdelivr.net/npm/html2canvas@1.4.1/dist/html2canvas.min.js
// ==/UserScript==

if (typeof unsafeWindow == 'undefined') {
    if ($('.ivu-table-header').length == 0) {
        let target = undefined
        let footer = $('.footer-main-list .mains-navbtn')
        for (let i = 0; i < footer.length; i++) {
            if (footer[i].innerHTML == "我要选课") {
                target = i
                break
            }
        }
        if (target != undefined) {
            unsafeWindow = window.frames[target]
        }
    } else {
        unsafeWindow = window
    }
}
if (typeof GM_addStyle != 'undefined') {
    GM_addStyle(`
/* The Modal (background) */
.modal {
  position: fixed; /* Stay in place */
  z-index: 10; /* Sit on top */
  padding-top: 5px; /* Location of the box */
  left: 0;
  top: 0;
  width: 100%; /* Full width */
  height: 100%; /* Full height */
  overflow: auto; /* Enable scroll if needed */
  background-color: rgb(0,0,0); /* Fallback color */
  background-color: rgba(0,0,0,0.4); /* Black w/ opacity */
}

/* Modal Content */
.modal-content {
  position: relative;
  background-color: #fefefe;
  margin: auto;
  padding: 0;
  width: 80%;
  box-shadow: 0 4px 8px 0 rgba(0,0,0,0.2),0 6px 20px 0 rgba(0,0,0,0.19);
  -webkit-animation-name: animatetop;
  -webkit-animation-duration: 0.4s;
  animation-name: animatetop;
  animation-duration: 0.4s
}

/* Add Animation */
@-webkit-keyframes animatetop {
  from {top:-300px; opacity:0}
  to {top:0; opacity:1}
}

@keyframes animatetop {
  from {top:-300px; opacity:0}
  to {top:0; opacity:1}
}

/* The Close Button */
.close {
  color: white;
  float: right;
  font-size: 28px;
  font-weight: bold;
}

.close:hover,
.close:focus {
  color: #000;
  text-decoration: none;
  cursor: pointer;
}

.modal-header {
  padding: 2px 16px;
  height: 42px;
  background-color: #5cb85c;
  color: white;
}

.modal-title {
    padding-top: 6px;
    color: white;
  float: left;
  font-size: 20px;
  font-weight: bold;
}

.toast-notification {
    position: fixed;
    bottom: 20px;
    right: 20px;
    background-color: rgba(0, 0, 0, 0.7);
    color: white;
    padding: 10px 20px;
    border-radius: 5px;
    z-index: 9999;
    opacity: 0;
    transition: opacity 0.5s, transform 0.5s;
    transform: translateY(20px);
}
.toast-notification.show {
    opacity: 1;
    transform: translateY(0);
}
`);
}

function generatePopupDiv() {
    let popup = $("<div class='us-popup'></div>");
    let inner = $("<div class='us-popup-inner'></div>");
    let btn = $("<button type='button' class='us-popup-close'>×</button>");
    btn.on("click", () => {
        popup.hide();
    });
    popup.append(btn);
    popup.append(inner);
    popup.hide();
    return [popup, inner];
}

const timetableType = [
    [{ index: '1', name: '8:00' }, 1],
    [{ index: '2', name: '9:00' }, 1],
    [{ index: '3', name: '10:20' }, 1],
    [{ index: '4', name: '11:20' }, 1],
    [{ index: '5', name: '14:00' }, 1],
    [{ index: '6', name: '15:00' }, 1],
    [{ index: '7', name: '16:20' }, 1],
    [{ index: '8', name: '17:20' }, 1],
    [{ index: '9', name: '19:00' }, 1],
    [{ index: '10', name: '20:00' }, 1],
    [{ index: '11', name: '21:10' }, 1]
];
const week = ['周一', '周二', '周三', '周四', '周五'];

var timetable = undefined

var loadedCustomCourseTable = false

const weekday = { '一': 0, '二': 1, '三': 2, '四': 3, '五': 4 }

function genTimetableOption(isInit) {
    let res = {
        timetables: unsafeWindow.timetableArray,
        week: week,
        timetableType: timetableType,
        styles: {
            Gheight: ($(unsafeWindow).height() - 85) / 11,
            leftHandWidth: 30
        },
        gridOnClick: function (e) {
            if (unsafeWindow.lastClicked == e && e != '') {
                let courseName = e;
                for (let i = 0; i < unsafeWindow.timetableArray.length; i++) {
                    for (let j = 0; j < unsafeWindow.timetableArray[i].length; j++) {
                        unsafeWindow.timetableArray[i][j] = unsafeWindow.timetableArray[i][j].filter(function (v) {
                            return v !== e
                        })
                    }
                }
                localStorage.setItem("timetableArray", JSON.stringify(unsafeWindow.timetableArray))
                unsafeWindow.timetable.setOption(genTimetableOption(false));
                unsafeWindow.showToast(`课程 "${courseName}" 已从暂存课表移除`);
            }
            unsafeWindow.lastClicked = e
        }
    }
    if (isInit) {
        res.el = '#courseTable'
    }
    return res
}

function getColumnIndexByHeaderText(headerText) {
    let index = -1;
    // 遍历所有表头单元格
    $('.ivu-table-header th').each(function (i) {
        if ($(this).text().trim() === headerText) {
            index = i;
            return false; // 找到后即退出循环
        }
    });
    return index;
}

function addBtn() {
    const rows = $('.ivu-table-body .ivu-table-row')
    if ($('td:first button', rows).length != 0) {
        return
    }
    if (!loadedCustomCourseTable) {
        if ($('.ivu-layout-header button').eq(6).length != 0) {
            let exportBtn = $('<button class="ivu-btn ivu-btn-info"> \
                <span>导出PNG</span></button>');
            exportBtn.on('click', function (e) {
                e.stopPropagation(); // 防止点击后 modal 关闭
                unsafeWindow.showToast('正在生成图片，请稍候...');
                html2canvas(document.querySelector('#courseTable'), {
                    backgroundColor: '#fefefe',
                    useCORS: true
                }).then(canvas => {
                    let link = document.createElement('a');
                    link.download = 'sustech-timetable.png';
                    link.href = canvas.toDataURL('image/png');
                    link.click();
                });
            });

            let modal = $('<div class="modal"><div class="modal-content"> \
                <div class="modal-header"><span class="close">&times;</span> \
                <span class="modal-title">双击删除某门课</span></div>\
                <div class="modal-body" id="courseTable"></div></div></div>'
            );
            $('.modal-title', modal).after(exportBtn);
            $('.close', modal).on('click', function () {
                modal.hide()
            })
            modal.on('click', function () {
                modal.hide()
            }).children().on('click', function (e) {
                e.stopPropagation();
            })
            let btn = $('<button class="ivu-btn ivu-btn-info"> \
                <span>暂存课表查看</span></button>'
            )
            btn.on('click', function () {
                // 自动暂存所有“已选课程”
                let stashedNew = false;
                // 确认当前在“已选课程”标签页
                if ($(".ivu-layout .ivu-tabs-nav .ivu-tabs-tab-active").text().includes("已选")) {
                    console.log("正在从'已选课程'自动暂存...");
                    // 遍历所有课程行
                    $('.ivu-table-body .ivu-table-row').each(function () {
                        if (unsafeWindow.stashCourseFromRow($(this))) {
                            stashedNew = true;
                        }
                    });
                    if (stashedNew) {
                        localStorage.setItem("timetableArray", JSON.stringify(unsafeWindow.timetableArray));
                        console.log("自动暂存完成");
                    }
                }
                modal.show()
                unsafeWindow.timetable.setOption(genTimetableOption(false))
            })
            let removeAllBtn = $('<button class="ivu-btn ivu-btn-info"> \
                <span>清空暂存课表</span></button>'
            )
            removeAllBtn.on('click', function () {
                if (confirm("确认清空暂存课表吗？")) {
                    unsafeWindow.timetableArray = [
                        [[], [], [], [], [], [], [], [], [], [], []],
                        [[], [], [], [], [], [], [], [], [], [], []],
                        [[], [], [], [], [], [], [], [], [], [], []],
                        [[], [], [], [], [], [], [], [], [], [], []],
                        [[], [], [], [], [], [], [], [], [], [], []]
                    ];
                    localStorage.setItem("timetableArray", JSON.stringify(unsafeWindow.timetableArray))
                }
            })
            let foldbtn = $('<button class="ivu-btn ivu-btn-info"><span>课程时间表</span></button>')
            $('.ivu-layout-header button').eq(6).after(removeAllBtn).after(btn).after(foldbtn)
            $('#app').append(modal)
            unsafeWindow.timetableArray = JSON.parse(localStorage.getItem("timetableArray")) || [
                [[], [], [], [], [], [], [], [], [], [], []],
                [[], [], [], [], [], [], [], [], [], [], []],
                [[], [], [], [], [], [], [], [], [], [], []],
                [[], [], [], [], [], [], [], [], [], [], []],
                [[], [], [], [], [], [], [], [], [], [], []]
            ];
            unsafeWindow.timetable = new Timetables(genTimetableOption(true))
            modal.hide();
            // Toast 提示函数
            unsafeWindow.showToast = function (message) {
                let toast = $('<div class="toast-notification"></div>');
                toast.text(message);
                $('body').append(toast);

                // 使用 setTimeout 确保浏览器有时间渲染元素，再添加 show class 触发动画
                setTimeout(() => {
                    toast.addClass('show');
                }, 10);

                // 1秒后自动开始消失动画
                setTimeout(() => {
                    toast.removeClass('show');
                    // 在动画结束后从 DOM 中移除元素，防止页面上残留不可见的元素
                    setTimeout(() => {
                        toast.remove();
                    }, 500);
                }, 1000);
            }

            // 将暂存逻辑封装为单独函数
            unsafeWindow.stashCourseFromRow = function (row) {
                let teacher, clsName;
                const timeStrs = [];
                const selectedTab = $(".ivu-layout .ivu-tabs-nav .ivu-tabs-tab-active");

                const colIdxClass = getColumnIndexByHeaderText('教学班');
                if (colIdxClass !== -1) {
                    clsName = $('span', row.find('td').eq(colIdxClass)).html();
                } else {
                    if (selectedTab.text().includes("已选")) {
                        clsName = $('span', row.find('td').eq(3)).html();
                    } else {
                        clsName = $('span', row.find('td').eq(0)).html();
                    }
                }
                if (selectedTab.text().includes("已选")) {
                    teacher = $('a', row.find('td').eq(12)).html();
                    $('.ivu-tag-cyan p', row.find('td').eq(12)).each(function () {
                        timeStrs.push(this.innerHTML);
                    });
                } else {
                    teacher = $('a', row.find('td').eq(9)).html();
                    $('.ivu-tag-cyan p', row.find('td').eq(9)).each(function () {
                        timeStrs.push(this.innerHTML);
                    });
                }

                if (!clsName) return false; // 如果没有课程名称，直接返回 false

                let changed = false;
                for (let s of timeStrs) {
                    let res = s.match("星期(.)第(\\d+)-(\\d+)节");
                    if (res) {
                        for (let i = res[2] - 1; i < res[3]; i++) {
                            let name = clsName + ' ' + teacher;
                            if (!unsafeWindow.timetableArray[weekday[res[1]]][i].includes(name)) {
                                unsafeWindow.timetableArray[weekday[res[1]]][i].push(name);
                                changed = true;
                            }
                        }
                    }
                }
                return changed;
            }

            unsafeWindow.addToStashTable = function (btn) {
                const row = $(btn).closest('.ivu-table-row');
                const colIdxClass = getColumnIndexByHeaderText('教学班');
                let courseName;
                if (colIdxClass !== -1) {
                    courseName = $('span', row.find('td').eq(colIdxClass)).html();
                } else {
                    courseName = $('span', row.find('td').eq(0)).html() || $('span', row.find('td').eq(3)).html();
                }
                if (unsafeWindow.stashCourseFromRow(row)) {
                    localStorage.setItem("timetableArray", JSON.stringify(unsafeWindow.timetableArray));
                    unsafeWindow.showToast(`课程 "${courseName}" 已成功暂存！`);
                } else {
                    unsafeWindow.showToast(`课程 "${courseName}" 已存在。`);
                }
            }
        }
    }

    rows.each(function () {
        let btn = $('<button type="button" \
            class="ivu-btn ivu-btn-success ivu-btn-small"><span>暂存</span></button>')
        btn.on('click', function () {
            addToStashTable(this)
        })
        $('td:first', this).append(btn)
    })
    return
}

// 自动高亮已选超出容量的课程
function hightlightRiskyCourses() {
    $('.ivu-table-cell-slot').each(function () {
        var matches = $(this).text().replaceAll('\n', '').replaceAll('\t', '').match(/本科生容量：(\d+).*已选人数：(\d+).*/);
        if (matches) {
            if (parseInt(matches[2]) > parseInt(matches[1])) $(this).css('color', 'red');
            if (parseInt(matches[2]) == parseInt(matches[1])) $(this).css('color', 'orange');
        }
    });

}

// 链接教师到评教平台
function addSearchLinks() {
    var links = $('a[href="javascript:void(0);"]').filter(function () {
        return $(this).text().trim() !== '';
    });
    links.each(function () {
        $(this).attr('href', 'https://ncesnext.com/search/?q=' + $(this).text());
        $(this).attr('target', '_blank');
    });
}

// 隐藏及显示课程信息
function showInfo() {
    $('.ivu-tag-text').show();
    $('.ivu-tag-text').parent().addClass('ivu-tag-checked');
    $('button:contains("课程时间表")').text('折叠课程时间表');
    $('b:contains("上课信息")').text('上课信息:');
}

function hideInfo() {
    $('.ivu-tag-text').hide();
    $('.ivu-tag-text').parent().removeClass('ivu-tag-checked');
    $('button:contains("课程时间表")').text('展开课程时间表');
    $('b:contains("上课信息")').text('上课信息(已折叠)');
}

function initInfoVisibility() {
    if ($('b:contains("上课信息:")').length == 0) return;
    if (!getCookie("hideTimeTable") || getCookie("hideTimeTable") == '0') {
        $('button:contains("课程时间表")').text('折叠课程时间表');
        setCookie("hideTimeTable", "0");
    } else {
        if (!$('.ivu-tag-text').is(':visible')) return;
        hideInfo();
    }
    $('button:contains("课程时间表")').off('click').on('click', function () {
        if (getCookie("hideTimeTable") == '0') {
            hideInfo();
            setCookie("hideTimeTable", "1");
        } else {
            showInfo();
            setCookie("hideTimeTable", "0");
        }
    });
}

function setCookie(name, value) {
    document.cookie = name + "=" + value + "; path=/";
}

function getCookie(name) {
    var cookieName = name + "=";
    var cookies = document.cookie.split(';');
    for (var i = 0; i < cookies.length; i++) {
        var cookie = cookies[i].trim();
        if (cookie.indexOf(cookieName) === 0) {
            return cookie.substring(cookieName.length, cookie.length);
        }
    }
    return null;
}

function handleSearchInput() {
    // 搜索框按下回车键时触发搜索
    var searchInput = $("input[placeholder=课程]");
    if (searchInput.length) {
        $(searchInput[0]).on('keydown', function (e) {
            if (e.keyCode === 13) $('button:contains("查询")')[0].click();
        });
        $(searchInput[0]).attr("placeholder", "课程(按Enter搜索)");
        loadedCustomCourseTable = true
    }
}

let current_year;
let current_semester;
let remaining_point;
let used_point;
let isFetching = false;

async function fetchPointFromAPI() {

    if (isFetching) {
        return;
    }
    isFetching = true;

    const last_year = current_year - 1;

    try {
        const response = await fetch('https://tis.sustech.edu.cn/Xsxk/queryKxrw', {
            method: "POST",
            headers: {
                "accept": "*/*",
                "accept-language": "zh-CN,zh;q=0.9",
                "content-type": "application/x-www-form-urlencoded; charset=UTF-8",
                "rolecode": "01",
                "sec-fetch-dest": "empty",
                "sec-fetch-mode": "cors",
                "sec-fetch-site": "same-origin",
                "x-requested-with": "XMLHttpRequest"
            },
            referrer: "https://tis.sustech.edu.cn/Xsxk/query/1",
            referrerPolicy: "strict-origin-when-cross-origin",
            body: `cxsfmt=0&p_pylx=1&p_xn=${last_year}-${current_year}&p_xq=${current_semester}&p_xnxq=${last_year}-${current_year}${current_semester}&p_xkfsdm=bxxk`,
            mode: "cors",
            credentials: "include"
        });

        const data = await response.json();
        const selected_course = data["yxkcList"];
        remaining_point = parseInt(data["xsxkPage"]["xkgzszOne"]["jfxs"]);
        used_point = selected_course.reduce((sum, course) => {
            if (course["xkxs"] !== null) { // 后置课程此项为null
                sum += parseInt(course["xkxs"]);
            }
            return sum;
        }, 0);

    } catch (error) {
        // console.error(error);
        return;
    }

    const marker = $(".tis-helper-marker-display")
    if (marker.length == 0) {
        let display = $(`<div class="ivu-alert ivu-alert-error" style="display: inline-block; margin-left: 0.5rem"><span class="ivu-alert-message">
            <span class="tis-helper-marker-display">总积分：${used_point + remaining_point}，已用分数：${used_point}，剩余分数：${remaining_point}</span>
        </span></div>`)
        $('.ivu-layout-header .ivu-alert-error').eq(0).after(display)
    } else {
        marker.html(`总积分：${used_point + remaining_point}，已用分数：${used_point}，剩余分数：${remaining_point}`)
    }

    isFetching = false;
}

function checkPointUpdate() {

    let need_update = false;

    // 检查是否需要更新年份和学期
    const regex = /^(\d{4})(春|夏|秋)季$/;
    const seasonMapping = {
        春: 2,
        夏: 3,
        秋: 1
    };
    const selectedElements = $(".ivu-layout .ivu-select-selection .ivu-select-selected-value");
    let temp_year, temp_semester;

    selectedElements.each(function () {
        const matches = $(this).text().trim().match(regex);
        if (matches) {
            temp_year = parseInt(matches[1]);
            temp_semester = seasonMapping[matches[2]];
            if (temp_semester === 1) {
                temp_year += 1;
            }

            if (current_year !== temp_year || current_semester !== temp_semester) {
                need_update = true;
                current_year = temp_year;
                current_semester = temp_semester;
            }

            return false;
        }
    });

    if (need_update) {
        fetchPointFromAPI();
        return;
    }

    // 检查是否需要更新已用分数和剩余分数
    const tab = $(".ivu-layout .ivu-tabs-nav .ivu-tabs-tab-active")
    if (tab.text().includes("已选")) { // 已选课程页面
        const inputs = $(".ivu-table-fixed-right .ivu-table-row td:not(.ivu-table-hidden) input");
        let temp_used_point = 0;
        inputs.each(function () {
            temp_used_point += parseInt(this.value);
        });

        if (temp_used_point !== used_point) {
            need_update = true;
        }
    } else { // 选课页面
        const remainingPointsElement = $(".ivu-layout .ivu-layout-header .ivu-alert-message").find("span:contains('剩余积分')").text();
        const remainingPointsMatch = remainingPointsElement.match(/剩余积分:(\d+(\.\d+)?)/);
        if (remainingPointsMatch) {
            const temp_remaining_point = parseFloat(remainingPointsMatch[1]);
            if (temp_remaining_point !== remaining_point) {
                need_update = true;
            }
        }
    }

    if (need_update) {
        fetchPointFromAPI();
    }
}

function startReferesh() {
    setInterval(checkPointUpdate, 1000)
    setInterval(addBtn, 1000)
    setInterval(hightlightRiskyCourses, 1000)
    setInterval(addSearchLinks, 1000)
    setInterval(initInfoVisibility, 200)
    setInterval(handleSearchInput, 1000)
}

(function () {
    'use strict';
    const divs = generatePopupDiv()
    const popup = divs[0], inner = divs[1]
    $('body').append(popup)
    let err = false
    if (typeof unsafeWindow == 'undefined') {
        inner.append("加载失败。如果您是在浏览器中直接导入的，请确保您的console是通过右键选课页面中除标题栏和底栏的位置打开的。<br />")
        err = true
    }
    if (typeof Timetables == 'undefined') {
        inner.append("课程表样式加载失败。请检查网络（或者挂个梯子试试？）<br />")
        err = true
    }
    if (err) {
        popup.show()
        return
    }
    startReferesh()
})();

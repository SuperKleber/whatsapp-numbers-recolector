// Copyright 2018 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

"use strict";
let lblMsg = document.getElementById("lblMsg");
let btn_exp_unknown = document.getElementById("btn_exp_unknown");
let lblStatus = document.getElementById("lblStatus");
let btn_exp_cancel = document.getElementById("btn_exp_cancel");
var is_running = false;
var no_count = 0;
var nums_all = [];
function reset_controls() {
  no_count = 0;
  is_running = false;
  btn_exp_cancel.style.display = "none";
  btn_exp_unknown.disabled = false;
  lblMsg.innerText = "";
  lblStatus.innerText = "";
}
function constructExp() {
  reset_controls();
  btn_exp_unknown.addEventListener("click", function() {
    nums_all = [];
    is_running = true;
    btn_exp_cancel.style.display = "";
    btn_exp_unknown.disabled = true;
    lblMsg.innerText = "";
    lblStatus.innerText = "Please wait...";
    get_contacts(true);
  });
  btn_exp_cancel.addEventListener("click", function() {
    exp_now();
    nums_all = [];
    reset_controls();
  });
}
function get_contacts(is_unknown) {
  try {
    chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
      var activeTab = tabs[0];
      var url = activeTab.url;
      if (!url.includes("web.whatsapp.com")) {
        var msg = "Open web.whatsapp.com and connect with your WhatsApp";
        reset_controls();
        alert1(msg);
        return;
      }

      function scrollDown() {
        var list = document.getElementsByTagName("span");
        var last_elem;
        var prev_y = -1;
        for (var i = 0; i < list.length; i++) {
          if (!list[i].dir) continue;
          if (list[i].dir != "auto") continue;
          if (!list[i].title) continue;
          var rect = list[i].getBoundingClientRect();
          if (prev_y == -1) {
            prev_y = rect.bottom;
            last_elem = list[i];
          } else {
            if (prev_y < rect.bottom) {
              last_elem = list[i];
              prev_y = rect.bottom;
            }
          }
        }
        if (last_elem) {
          last_elem.scrollIntoView({
            behavior: "smooth",
            block: "start",
            inline: "nearest"
          });
        }
        return "ok";
      }
      function getItems() {
        var list = document.getElementsByTagName("span");
        var nums = [];
        for (var i = 0; i < list.length; i++) {
          if (!list[i].dir) continue;
          if (list[i].dir != "auto") continue;
          if (!list[i].title) continue;
          var num = list[i].title;
          num = num.replace(/\s/g, "");
          num = num.replace(/-/g, "");
          num = num.replace(/[[\]]/g, "");
          num = num.replace(/[{()}]/g, "");
          var num_str = num.replace(/\+/g, "");
          if (num == "") continue;
          var isnum = /^\d+$/.test(num_str);
          if (!isnum) continue;
          var exts = nums.includes(num);
          if (exts) continue;
          // nums.push(parseInt(num.replace("+591", "")));
          nums.push(num);
        }
        var res = JSON.stringify(nums);
        return res;
      }
      function doit() {
        if (!is_running) {
          reset_controls();
          return;
        }
        chrome.tabs.executeScript(
          {
            code: "(" + getItems + ")();"
          },
          results => {
            var nums_this = JSON.parse(results);
            var got = false;
            for (var i = 0; i < nums_this.length; i++) {
              if (!nums_all.includes(nums_this[i])) {
                nums_all.push(nums_this[i]);
                got = true;
              }
            }
            if (got) no_count = 0;
            else no_count++;
            lblStatus.innerText =
              "collected " +
              nums_all.length.toString() +
              "numbers. Please wait...";
            // if (no_count > 10) {
            //   lblStatus.innerText =
            //     "Finalizado. Se obtuvo " +
            //     nums_all.length.toString() +
            //     " números.";
            //   exp_now();
            //   return;
            // }
            chrome.tabs.executeScript(
              {
                code: "(" + scrollDown + ")();"
              },
              results1 => {
                setTimeout(function() {
                  doit();
                }, 1000);
              }
            );
          }
        );
      }
      // var code = "window.location.reload();";
      var code = "console.log('start');";
      chrome.tabs.executeScript(
        {
          code: code
        },
        results1 => {
          setTimeout(function() {
            this.log1("called after reloading");
            doit();
          }, 1000);
        }
      );
    });
  } catch (exp) {
    log1(exp);
  }
}
function exp_now() {
  if (nums_all.length == 0) {
    alert1("There are no new numbers available to export");
    return;
  }
  var res = "phone \n";
  for (var i = 0; i < nums_all.length; i++) {
    res += nums_all[i];
    if (i < nums_all.length - 1) res += ",\n";
  }
  var blob = new Blob([res], { type: "text/csv;charset=utf-8;" });
  var url = URL.createObjectURL(blob);
  chrome.downloads.download({
    filename: "numeros-recolectados.csv",
    url: url
  });
  log1("exp_now");
}
function log1(msg) {
  //console.log(msg);
}
function alert1(msg) {
  let lblMsg = document.getElementById("lblMsg");
  lblMsg.innerText = msg;
  log1(msg);
}
constructExp();

// stored variables
const DEBUGMODE = false;
const STORAGE_USEDARKTHEME = "useDarkTheme";
const STORAGE_WIDTH = "table_width";
const STORAGE_HEIGHT = "table_height";
const DEFAULT_LAYOUT_WIDTH = 3;
const DEFAULT_LAYOUT_HEIGHT = 3;
const STORAGE_TIMEZONE = "timezone";
const STORAGE_INTERVALS = "intervals";
const STORAGE_SHOWDETAILS = "showDetails";
const STORAGE_SHOWBOTTOMTOOLBAR = "showBottomToolbar";
const STORAGE_ALLOWSYMBOLCHANGE = "allowSymbolChange";
const STORAGE_USESMALLBUTTON = "useSmallButton";
const STORAGE_CHARTSPAIRS = "chartPairs";

let gbl_dark = true; // Default to dark theme
let gbl_boxWidth = "";
let gbl_boxHeight = "";
let gbl_isStorageUsable = true;
let gbl_inputPairId = -1;
let gbl_chartIntervalsNdx = 0;
let gbl_chartIntervals = ["3", "15", "45"];

let chartPairs = new Array();
let chartIntervals = new Array();
// setup the UI / charts layout
function initPage() {
  loadPairs();
  loadParameters();
  darken();
  for (let i = 0; i < chartPairs.length; i++) createChart(chartPairs[i]);

  colorWidthHeight();
  setChartCount();
}
function colorWidthHeight() {
  var tmp;

  tmp = storeMAN(false, STORAGE_WIDTH);
  tmp = tmp ? tmp : DEFAULT_LAYOUT_WIDTH;
  let elementWidth = document.getElementById("box-width");

  setWidth(tmp);
  elementWidth.value = tmp;
  elementWidth.addEventListener(
    "change",
    function() {
      setWidth(parseInt(elementWidth.value));
    },
    true
  );

  tmp = storeMAN(false, STORAGE_HEIGHT);
  tmp = tmp ? tmp : DEFAULT_LAYOUT_HEIGHT;
  let elementHeight = document.getElementById("box-height");

  setHeight(tmp);
  elementHeight.value = tmp;
  elementHeight.addEventListener(
    "change",
    function() {
      setHeight(parseInt(elementHeight.value));
    },
    true
  );

  if (gbl_dark === null || !gbl_dark) {
    lighten();
  } else {
    darken();
  }
}
function toglAddChart() {
  document.getElementById("addMultiChart").style.display = "none";
  document.getElementById("divRefreshChart").style.display = "none";
  var configDiv = document.getElementById("addSingleChart");
  if (configDiv.style.display === "block") {
    configDiv.style.display = "none";
    return;
  }
  configDiv.style.display = "block";
  document.getElementById("SinglepairsInput").focus();
}
// NOcharts view js callable functions
function inputPairs(element) {
  var autolist = document.getElementById("pairsInputautocomplete-list");
  if (!element) {
    element = document.getElementById("pairsInput");
    let listPairs = document.getElementById("listPairs");
    listPairs.options[listPairs.options.length] = new Option(
      element.value.toUpperCase(),
      element.value.toUpperCase()
    );
    element.value = "";
    document.getElementById("pairsInput").focus();
  } else {
    if (event.which === 13) {
      event.preventDefault();
      if (gbl_inputPairId < 0) chartTicker = element.value.toUpperCase();
      else chartTicker = autolist.children[gbl_inputPairId].innerText;
      inputPairsClose();
      let listPairs = document.getElementById("listPairs");
      listPairs.options[listPairs.options.length] = new Option(
        chartTicker,
        chartTicker
      );
      element.value = "";
      document.getElementById("pairsInput").focus();
    } else if (event.which === 38 || event.which === 40) {
      if (gbl_inputPairId >= 0)
        autolist.children[gbl_inputPairId].classList = "";
      gbl_inputPairId += event.which === 38 ? -1 : 1;
      if (gbl_inputPairId >= 0)
        autolist.children[gbl_inputPairId].classList = "autocomplete-active";
    } else {
      inputPairsClose();
      let a = document.createElement("DIV");
      a.setAttribute("id", element.id + "autocomplete-list");
      a.setAttribute("class", "autocomplete-items");
      /*append the DIV element as a child of the autocomplete container:*/
      element.parentNode.appendChild(a);
    }
  }
  if (element.value.length < 1) inputPairsClose();
}
function inputPairsClose() {
  /*close all autocomplete lists in the document,
    except the one passed as an argument:*/
  gbl_inputPairId = -1;
  var x = document.getElementsByClassName("autocomplete-items");
  for (var i = 0; i < x.length; i++) {
    x[i].parentNode.removeChild(x[i]);
  }
}
function letsGo() {
  var listPairs = document.getElementById("listPairs");
  var options = listPairs.options;
  var optl = options.length;
  if (optl == 0) {
    alert("At least one exchange & chart pair are needed to get started.");
    return;
  }
  var urlStr = "?";
  for (var i = 0; i < optl; i++) {
    if (i != 0) urlStr += "&";
    urlStr += "chart=" + options[i].value;
  }
  window.top.location.href = urlStr;
}
// charts view js callable functions
// chart right side bar
function toggleFullscreenChart(elementId) {
  let box = document.getElementById(elementId);

  if (box.classList.contains("fullscreen")) {
    box.classList.remove("fullscreen");
  } else {
    box.classList.add("fullscreen");
  }
}

function removeChart(boxElement, pairsCSV) {
  boxElement.parentNode.removeChild(boxElement);
  if (DEBUGMODE)
    console.log("removeChart(): " + boxElement.id + " " + pairsCSV);

  //find the ticker index and remove it from the array
  chartPairs.splice(chartPairs.findIndex(x => x == pairsCSV), 1);

  //reset url
  let urlStr = window.top.location.href.substr(
    0,
    top.location.href.lastIndexOf("?") + 1
  );
  for (let i = 0; i < chartPairs.length; i++) {
    if (i != 0) urlStr += "&";
    urlStr += "chart=" + chartPairs[i];
  }
  history.replaceState(null, document.title, urlStr);

  if (DEBUGMODE) console.log("\t" + STORAGE_CHARTSPAIRS + ": " + pairsCSV);
  setChartCount();
}

// topbar funcs
function addChartToList(keyEvent) {
  keyEvent.preventDefault();
  if (keyEvent.keyCode === 13) {
    let chartTicker = this.value.toUpperCase();
    let listPairs = document.getElementById("listPairs");
    listPairs.options[listPairs.options.length] = new Option(
      chartTicker,
      chartTicker
    );
    chartPairs.push(chartTicker);
    if (DEBUGMODE) console.log("addChart(): " + chartTicker);
    if (DEBUGMODE) console.log("\t" + STORAGE_CHARTSPAIRS + ": " + chartPairs);
    history.replaceState(
      null,
      document.title,
      window.top.location.href + "&chart=" + chartTicker
    );

    createChart(chartTicker);
    colorWidthHeight();
    this.value = "";
    toglAddChart();
  }
}

function createChart(chartTicker) {
  let boxElement = document.createElement("div");
  //use unique id based on milliseconds
  var i = new Date().getTime();
  boxElement.setAttribute("id", "box" + i);
  boxElement.setAttribute("class", "box");
  document.body.appendChild(boxElement);
  var theme = gbl_dark === true ? "Dark" : "Light";
  var toolbarbg = gbl_dark === true ? "rgb(27, 32, 48)" : "rgb(227, 232, 248)";

  var timezoneSelect = document.getElementById("timezone");
  var timezoneValue =
    timezoneSelect.options[timezoneSelect.selectedIndex].value;

  usrSelct = storeMAN(false, STORAGE_INTERVALS);
  var intervalSelect = document.getElementById("interval");
  intervalSelect.value = usrSelct
    ? usrSelct
    : gbl_chartIntervals[gbl_chartIntervalsNdx++ % 3];
  var intervalValue =
    intervalSelect.options[intervalSelect.selectedIndex].value;

  var detailsChk = document.getElementById("details");
  var details = detailsChk.checked ? true : false;
  var withdaterangesChk = document.getElementById("withdateranges");
  var withdateranges = withdaterangesChk.checked ? true : false;
  var allowsymbolchangeChk = document.getElementById("allow_symbol_change");
  var allowsymbolchange = allowsymbolchangeChk.checked ? true : false;
  var usesmallbuttonChk = document.getElementById("usesmallbutton");
  var usesmallbutton = usesmallbuttonChk.checked
    ? "button-fullscreen-small"
    : "button-fullscreen";

  new TradingView.widget({
    container_id: "box" + i,
    autosize: true,
    symbol: chartTicker,
    interval: intervalValue,
    timezone: timezoneValue,
    theme: theme,
    style: "8",
    locale: "en",
    toolbar_bg: toolbarbg,
    enable_publishing: false,
    hide_top_toolbar: false,
    hide_side_toolbar: true,
    // range: "70m",
    allow_symbol_change: allowsymbolchange,
    studies: [
      "LinearRegression@tv-basicstudies",
      "AwesomeOscillator@tv-basicstudies",
      "ZigZag@tv-basicstudies"
    ],
    show_popup_button: false,
    withdateranges: withdateranges,
    details: details,
    hideideas: true
  });

  let topButtonContainerElement = document.createElement("div");
  topButtonContainerElement.setAttribute("class", "box-button-container");

  //Show in Fullscreen button
  let btnEl = document.createElement("a");
  btnEl = document.createElement("a");
  btnEl.setAttribute("class", usesmallbutton);
  btnEl.setAttribute("href", "javascript:void(0)");
  btnEl.setAttribute("title", "Show in Fullscreen");
  btnEl.setAttribute("data-balloon-length", "small");
  btnEl.setAttribute("data-balloon", "Show in Fullscreen");
  btnEl.setAttribute("data-balloon-pos", "left");
  btnEl.addEventListener("click", toggleFullscreenChart.bind(null, "box" + i));
  // let italicsElement = document.createElement("i");
  // italicsElement.setAttribute("class", "fa fa-expand");
  btnEl.innerHTML = "&#10064;";
  // btnEl.appendChild(italicsElement);

  topButtonContainerElement.appendChild(btnEl);

  //Remove this Chart button
  btnEl = document.createElement("a");
  btnEl.setAttribute("class", usesmallbutton);
  btnEl.setAttribute("href", "javascript:void(0)");
  btnEl.setAttribute("title", "Remove this Chart");
  btnEl.setAttribute("data-balloon-length", "small");
  btnEl.setAttribute("data-balloon", "Remove this Chart");
  btnEl.setAttribute("data-balloon-pos", "left");
  btnEl.addEventListener(
    "click",
    removeChart.bind(null, boxElement, chartTicker)
  );
  btnEl.innerHTML = "&#10005;";

  topButtonContainerElement.appendChild(btnEl);

  boxElement.appendChild(topButtonContainerElement);
}

function change_theme() {
  if (gbl_dark === true) {
    lighten();
  } else {
    darken();
  }

  //https://stackoverflow.com/a/10842519
  //remove all box
  var elements = document.getElementsByClassName("box");
  while (elements.length > 0) {
    elements[0].parentNode.removeChild(elements[0]);
  }

  //recreate the charts
  for (let i = 0; i < chartPairs.length; i++) {
    createChart(chartPairs[i] !== null ? chartPairs[i] : "BITMEX:XBTUSD");
  }
  colorWidthHeight();
}

function btnRemovePairsClick() {
  removeOptions(document.getElementById("listPairs").options, true);
}

function useSmallButtonClick(el) {
  try {
    localStorage.setItem(STORAGE_USESMALLBUTTON, el.checked);
  } catch (e) {}
  if (
    document.getElementById("nocharts").style.display == "block" ||
    document.getElementById("nocharts").style.display == ""
  )
    return;

  var fromClass, toClass;
  if (el.checked) {
    fromClass = "button-fullscreen";
    toClass = "button-fullscreen-small";
  } else {
    fromClass = "button-fullscreen-small";
    toClass = "button-fullscreen";
  }
  let elementArray = document.getElementsByClassName(fromClass);
  while (elementArray.length) {
    elementArray[0].className = toClass;
  }
}

function removeOptions(elOption, removeSelectedOptions) {
  var i = elOption.length;
  while (i--) {
    var current = elOption[i];
    if (removeSelectedOptions) {
      if (current.selected) current.parentNode.removeChild(current);
      rebuildChartsPairsArray();
    } else {
      current.parentNode.removeChild(current);
    }
  }
}

// charts internal js functions
//set height
function setHeight(height) {
  try {
    height = JSON.parse(height);
  } catch (e) {}
  var elements = document.getElementsByClassName("box");
  for (var i = 0, len = elements.length; i < len; i++) {
    elements[i].style.height =
      "calc((100% / " + height + ") - (" + 29 / height + "px)";
  }
  try {
    localStorage.setItem(STORAGE_HEIGHT, height);
  } catch (e) {}
  gbl_boxHeight = height;
}

// set width
function setWidth(width) {
  try {
    width = JSON.parse(width);
  } catch (e) {}
  var elements = document.getElementsByClassName("box");
  for (var i = 0, len = elements.length; i < len; i++) {
    elements[i].style.width = "calc(100% / " + width + ")";
  }
  try {
    localStorage.setItem(STORAGE_WIDTH, width);
  } catch (e) {}
  gbl_boxWidth = width;
}

// set chart count
function setChartCount() {
  document.getElementById("configChart").innerHTML =
    "ADD CHART / SETTINGS (" + chartPairs.length + ")";
}

// lighten theme action
function lighten() {
  document.getElementById("theme-toggle").innerHTML = "DARK";
  document.getElementById("box-height").classList.remove("dark");
  document.getElementById("box-width").classList.remove("dark");
  document.body.classList.remove("dark");
  try {
    localStorage.setItem(STORAGE_USEDARKTHEME, "false");
  } catch (e) {}
  gbl_dark = false;
}

// darken theme Action
function darken() {
  document.getElementById("theme-toggle").innerHTML = "LIGHT";
  document.getElementById("box-height").classList.add("dark");
  document.getElementById("box-width").classList.add("dark");
  document.body.classList.add("dark");
  try {
    localStorage.setItem(STORAGE_USEDARKTHEME, "true");
  } catch (e) {}
  gbl_dark = true;
}

// load charts
// TODO: rewrite this logic for storing chart pairs and rendering default ones
function loadPairs() {
  let url = window.location.href;
  let expression = /[?&]chart(=([^&#]*)|&|#|$)/g;
  let match;
  let i = 0;
  while ((match = expression.exec(url))) {
    chartPairs.push(match[2].replace(/\+/g, " "));
    i++;
  }
  if (chartPairs.length == 0) {
    //if there are no chart= parameter in URL, attempt to read from previous session via localstorage
    var pairsCSV = storeMAN(false, STORAGE_CHARTSPAIRS);
    var listPairs = document.getElementById("listPairs");
    if (pairsCSV) {
      //if there are any charts in previous localstorage, restore them
      var pairsARR = pairsCSV.split(",");
      for (i = 0; i < pairsARR.length; i++) {
        chartPairs.push(pairsARR[i]);
      }
    } else {
      //if there are nothing in the localstorage, use some default value
      chartPairs.push("BITMEX:XBTUSD");
      chartPairs.push("BITMEX:XBTUSD");
      chartPairs.push("BITMEX:XBTUSD");
      chartPairs.push("BITMEX:ETHUSD");
      chartPairs.push("BITMEX:ETHUSD");
      chartPairs.push("BITMEX:ETHUSD");
      chartPairs.push("AMEX:UUP");
      chartPairs.push("AMEX:UUP");
      chartPairs.push("AMEX:UUP");
    }
  }
  let chartPUrl = location.origin + "tradingview-mc/?";
  chartPairs.forEach(function(_) {
    chartPUrl += "chart=" + _ + "&";
  });
  try {
    history.replaceState(null, document.title, chartPUrl);
  } catch (error) {}
  try {
    loadDoc();
  } catch (error) {}
}

// load chart parameters
function loadParameters() {
  storeMAN(true, STORAGE_CHARTSPAIRS, chartPairs);
  gbl_dark = JSON.parse(storeMAN(false, STORAGE_USEDARKTHEME));
  let usrSelct = storeMAN(false, STORAGE_TIMEZONE);
  document.getElementById("timezone").value = usrSelct ? usrSelct : "Etc/UTC";
  usrSelct = storeMAN(false, STORAGE_SHOWDETAILS);
  document.getElementById("details").checked = usrSelct === "true";
  usrSelct = storeMAN(false, STORAGE_SHOWBOTTOMTOOLBAR);
  document.getElementById("withdateranges").checked = usrSelct === "true";
  usrSelct = storeMAN(false, STORAGE_ALLOWSYMBOLCHANGE);
  document.getElementById("allow_symbol_change").checked = usrSelct !== "false";
  usrSelct = storeMAN(false, STORAGE_USESMALLBUTTON);
  document.getElementById("usesmallbutton").checked = usrSelct === "true";
}

// MISC
// show modal
//http://freefrontend.com/css-modal-windows/
//https://codepen.io/danielgriffiths/pen/AXGOym
function showInfo() {
  var mdl = document.getElementsByClassName("modalInfo");
  if (mdl[0].style.visibility === "hidden" || mdl[0].style.visibility === "") {
    mdl[0].style.visibility = "visible";
    mdl[0].style.opacity = 1;
  } else {
    mdl[0].style.visibility = "hidden";
    mdl[0].style.opacity = 0;
  }
}

function showMultiConfig() {
  var mdl = document.getElementsByClassName("modalConfig");
  if (mdl[0].style.visibility === "hidden" || mdl[0].style.visibility === "") {
    mdl[0].style.visibility = "visible";
    mdl[0].style.opacity = 1;
  } else {
    mdl[0].style.visibility = "hidden";
    mdl[0].style.opacity = 0;
  }
  let listPairs = document.getElementById("listPairs");
  listPairs.options.length = 0;
  for (let i = 0; i < chartPairs.length; i++) {
    if (listPairs)
      listPairs.options[listPairs.options.length] = new Option(
        chartPairs[i],
        chartPairs[i]
      );
  }
}

// rebuild chart pairs
function rebuildChartsPairsArray() {
  chartPairs.length = 0;
  var listPairs = document.getElementById("listPairs");
  var options = listPairs.options;
  for (var i = 0; i < options.length; i++) {
    chartPairs.push(options[i].value);
  }
  storeMAN(STORAGE_CHARTSPAIRS, chartPairs);
}

// move ops
function arrangeChartListItem(up_down) {
  var x = document.getElementById("listPairs");
  x.options.add(
    x.selectedOptions[0],
    up_down ? x.selectedIndex - 1 : x.selectedIndex + 2
  );
  storeMAN(STORAGE_CHARTSPAIRS, chartPairs);
}

// tools
function storeMAN(add_sub = true, itemName = "", itemValu = "") {
  if (gbl_isStorageUsable) {
    try {
      if (add_sub) localStorage.setItem(itemName, itemValu);
      else return localStorage.getItem(itemName);
      return true;
    } catch (error) {
      gbl_isStorageUsable = false;
    }
  }
  return false;
}

function copyText(button, copyId) {
  var copyText = document.getElementById(copyId);
  var range = document.createRange();
  range.selectNode(copyText);
  window.getSelection().addRange(range);

  try {
    document.execCommand("copy");
  } catch (err) {
    console.log("Oops, unable to copy");
  }
  window.getSelection().removeAllRanges();

  button.innerText = "Copied!";
  window.setTimeout(() => {
    button.innerText = "Copy";
  }, 2000);
}

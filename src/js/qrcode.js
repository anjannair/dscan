import "../css/popup.css";
import QRCode from "davidshimjs-qrcodejs";
import $ from "jquery";
import { Web3Storage } from "web3.storage";
import "regenerator-runtime/runtime";

// QR code js library
const createQRCodeFor = (identifier, dimension) => {
  return new QRCode(identifier, {
    width: dimension,
    height: dimension,
    colorDark: "#000000",
    colorLight: "#ffffff",
    correctLevel: QRCode.CorrectLevel.L,
  });
};

var QR_CODE_DOWNLOAD = createQRCodeFor("qrcode-download", 400);
var QR_CODE_DISPLAY = createQRCodeFor("qrcode", 150);

// web3.storage API token
const token = process.env.API_TOKEN;
const client = new Web3Storage({ token });
let isTooltipVisible = false;

function hideLoader(callback) {
  $(".loader").hide(function () {
    $("section.flex-center > svg").css("aria-disabled", false);
    if (callback && typeof callback === "function") callback();
  });
}

function showLoader() {
  $(".loader").show(900);
  $("section.flex-center > svg").css("aria-disabled", true);
  $("#qrcode img").css("display", "none");
  $(".output-label + div").text("");
}

function showCopiedTooltip() {
  if (!isTooltipVisible) {
    $("#tooltip").css("display", "block");
    $("#tooltip-pointer").css("display", "block");
    isTooltipVisible = true;
    setTimeout(function () {
      $("#tooltip").css("display", "none");
      $("#tooltip-pointer").css("display", "none");
      isTooltipVisible = false;
    }, 1000);
  }
}

function uploadCallback(cid, ipfsLink) {
  // IPFS hash (CID)
  document.getElementById("cid").textContent = cid;
  // IPFS gateway link
  document.getElementById("link").textContent = ipfsLink;
  $("#svg-link")
    .off()
    .on("click", function () {
      window.open(ipfsLink, "_blank").focus();
    });
  // Copy CID to clipboard when copy button is clicked
  $("#svg-cid")
    .off()
    .on("click", function () {
      showCopiedTooltip();
      navigator.clipboard.writeText(cid);
    });
  // Generate QR code
  QR_CODE_DOWNLOAD.makeCode(ipfsLink);
  QR_CODE_DISPLAY.makeCode(ipfsLink);
  // Code to download qrcode
  $("#svg-download")
    .off()
    .on("click", function () {
      // gets the base64 source of the qr code image
      var qrCodeSrc = document.querySelector("#qrcode-download img").src;
      var a = document.createElement("a");
      // an invisible a tag is given that href.
      a.href = qrCodeSrc;
      // filename for the qrcode is set
      a.download = "dscan_QR.png";
      document.body.appendChild(a);
      // the a tag is clicked, triggering the download
      a.click();
      document.body.removeChild(a);
    });
}

// Generate decentralized QR code from file
$("#fileUpload").on("change", async function () {
  showLoader();
  var files = fileUpload.files;
  var name = files[0].name;
  var cid = await client.put(files);
  let ipfsLink = `https://dweb.link/ipfs/${cid}/${name}/`;
  hideLoader(function () {
    uploadCallback(cid, ipfsLink);
  });
});
QR_CODE_DISPLAY.clear();

// Generate decentralized QR code from folder
$("#folderUpload").on("change", async function () {
  showLoader();
  var files = folderUpload.files;
  var cid = await client.put(files);
  let ipfsLink = `https://dweb.link/ipfs/${cid}/`;
  hideLoader(function () {
    uploadCallback(cid, ipfsLink);
  });
});
QR_CODE_DISPLAY.clear();

// Opening new window on button click
$("#openNewWindow")
  .off()
  .on("click", function () {
    // Detect browsers and use the appropriate API
    var isFirefox = typeof InstallTrigger !== "undefined";
    var isChrome =
      !!window.chrome && (!!window.chrome.webstore || !!window.chrome.csi);
    console.log(isFirefox + "Firefox");
    console.log(isChrome + "Chrome");
    if (isFirefox) {
      browser.windows.create({
        url: "./fileUpload.html",
        type: "popup",
        height: 700,
        width: 400,
      });
    }
    if (isChrome) {
      chrome.windows.create({
        url: chrome.runtime.getURL("fileUpload.html"),
        type: "popup",
        height: 700,
        width: 400,
      });
    }
  });

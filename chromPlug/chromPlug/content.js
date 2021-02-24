console.log("內插腳本載入");
var account;
var pwd;
var authcode;
var token;
var authimg;





(function() {
    if(document.URL.match("/login.do$")){
        window.location.href = "https://nportal.ntut.edu.tw/index.do";
    }
    Init();
    //GetNum();
    //var i = 0;
    //setTimeout(function() {
        //if(document.getElementById("muid").value!=''&&document.getElementById("mpassword").value!=''){
    //document.getElementById("muid").setAttribute("autocomplete","on");
    //document.getElementById("mpassword").setAttribute("autocomplete","on");
    
    PostNum();
            //i++;
        //}        
    //},500);
    
    
    //Login();
})();
function Init(){
    account = document.getElementById("muid");
    pwd = document.getElementById("mpassword");
    authcode = document.getElementById("authcode");
    token = document.getElementsByName("token")[0];
    authimg = document.getElementById("authImage").getAttribute("src");
    console.log(authimg);
}
function Check(){
    return document.getElementById("muid").value!=null && 
    document.getElementById("mpassword").value!=null && 
    document.getElementById("authcode").value!=null;
}
function Login(){
    //while(!Check())alert("!!");
    var login = document.getElementsByName("login")[0];
    var inputs = document.getElementsByTagName('input');
    /*document.getElementById("mpassword").focus();
    document.getElementById("mpassword").click();
    for(var i = 0; i < inputs.length; i++) {
        if(inputs[i].type.toLowerCase() == 'submit') {
            inputs[i].click();
        }
    }*/
    //login.click();
    login.submit();
}


function GetNum(){
    var request = new XMLHttpRequest();
    console.log("http://localhost/predict_image?"+authimg.split("?")[1]);
    request.open("GET", "http://localhost/predict_image?"+authimg.split("?")[1]) ;
    request.setRequestHeader( 'Access-Control-Allow-Origin',"https://nportal.ntut.edu.tw/index.do" );
    request.setRequestHeader("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    request.send();
    
    request.onreadystatechange = function() {
        // 伺服器請求完成
        if (request.readyState === 4) {
            // 伺服器回應成功
            if (request.status === 200) {
                var type = request.getResponseHeader("Content-Type");   // 取得回應類型

                // 判斷回應類型，這裡使用 JSON
                /*
                if (type.indexOf("application/json") === 0) {               
                    var data = JSON.parse(request.responseText);
                    console.log(data);
                    authnum = data.message;
                }
                */
                var data = request.responseText;
                console.log(data);
                authcode.setAttribute("value",data);
                //document.getElementById("authImage").setAttribute("src",data)
                //Login();
            } else {
                alert("發生錯誤: " + request.status);
            }
        }
    }
}
function PostNum(){
    var request = new XMLHttpRequest();
    
    request.open("POST", "http://localhost/predict_image_url",true) ;
    request.setRequestHeader( 'Access-Control-Allow-Origin',"https://nportal.ntut.edu.tw/index.do" );
    request.setRequestHeader("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    var data = new FormData();
    var canvas = document.createElement('CANVAS');
    canvas.setAttribute('width',135);
    canvas.setAttribute('height',39);
    var context = canvas.getContext('2d');
    context.drawImage(document.getElementById("authImage"),0,0);
    dataURL = canvas.toDataURL('image/png');
    data.append("Url", dataURL);
    console.log(dataURL);
    request.send(data);
    
    request.onreadystatechange = function() {
        // 伺服器請求完成
        if (request.readyState === 4) {
            // 伺服器回應成功
            if (request.status === 200) {
                var type = request.getResponseHeader("Content-Type");   // 取得回應類型

                // 判斷回應類型，這裡使用 JSON
                /*
                if (type.indexOf("application/json") === 0) {               
                    var data = JSON.parse(request.responseText);
                    console.log(data);
                    authnum = data.message;
                }
                */
                var data = request.responseText;
                console.log(data);
                authcode.setAttribute("value",data);
                //document.getElementById("authImage").setAttribute("src",data)
                setTimeout(function() {
                
                    Login();

                },100);
                
            } else {
                alert("發生錯誤: " + request.status);
            }
        }
    }
}
if (!EQUIPMENT.app) EQUIPMENT=window.parent.EQUIPMENT;  //如果是PC端访问，把EQUIPMENT重制为父框架的EQUIPMENT对象
var vu=new Vue({
    el: '#app',
    data: {
        bid:'',  //当前操作布段的id编号
        UI: {
            firstLoad: true
        },
        editObject: {}  //操作记录详情
    },
    methods: {
        thisClose: function(){
            if (EQUIPMENT.app){
                //NOTICE 调用app的方法
                EQUIPMENT.detailsClose('record');
            }else{
                window.parent.vu.closeRecordView();
            }
        },
        _changeHash: function(){
            if (!this.UI.firstLoad) dialog.close('information');
            var hash=decodeURIComponent(location.hash.replace(/^#/,''));
            if (!hash){
                //打开默认页面
                this.bid='';
                this.editObject={};
                return false;
            }
            try{
                hash = JSON.parse(hash);
                if (!hash.bid) throw 'Parameters were lost';
                this.bid=hash.bid;
                if (!this.UI.firstLoad) this._getRecordDetails();
                return true;
            }catch(e){
                this.editObject={};
                var showObject={
                    cname:'error',
                    content:'缺少关键参数，无法获得布匹的操作记录',
                    btncancel:'', btnclose:'', btnsure:'确定',
                    closeCallback: function(id, dialogType, buttonType){
                        //vu.thisClose();
                    }
                };
                if (this.UI.firstLoad){
                    setTimeout(function(){
                        dialog.open('information',showObject);
                    },1000);
                }else{
                    dialog.open('information',showObject);
                }
            }
        },
        _formatQualified: function(status){   //处理检验状态
            var result={class:'',name:status? status: ''};
            switch(status){
                case '合格':
                    result.class='yes';
                    break;
                case '不合格':
                    result.class='no';
                    break;
            }
            return result;
        },
        _getRecordDetails: function(){   //获得操作日志详细
            //清空可能已有的数据
            this.editObject={};
            if (!this.bid) return;
            ajax.send({
                url: PATH.recordDetails,
                data: {id: vu.bid},
                success: function(data){
                    dialog.close('loading');
                    vu.editObject=data;
                    //vu.recordObject.product_code=vu.recordKey[id].product_code;
                }
            });
        },
        printDoginHistory: function(dataObject,opsition,count){  //打印历史记录的标签
            var printStr;
            if (opsition==='start' || opsition==='end'){
                if (dataObject.current_length<=0){
                    dialog.open('resultShow',{content:'布匹剩余长度为0，无法响应该操作'});
                    return;
                }
            }
            if (opsition==='start'){
                if (dataObject.start==='start_a'){
                    printStr=dataObject.print_head;
                }else{
                    printStr=dataObject.print_tail;
                }
            }else if(opsition==='end'){
                if (dataObject.start==='start_a'){
                    printStr=dataObject.print_tail;
                }else{
                    printStr=dataObject.print_head;
                }
            }else{
                printStr=dataObject? dataObject.print_data:'';
            }
            printStr=JSON.stringify(printStr);
            console.log(printStr);
            EQUIPMENT.print(printStr,count);
        },
        gotoURLClick: function(obj,type){ //操作记录页面的按钮点击处理
            if (obj.current_length<=0){
                dialog.open('resultShow',{content:'布匹剩余长度为0，无法响应该操作'});
            }else{
                if (EQUIPMENT.app){
                    //NOTICE 调用app对应的方法
                    EQUIPMENT.detailsOpen(type,obj.bolt_id);
                }else{
                    window.parent.vu.openDetails(type,obj.bolt_id);
                }
            }
        }
    },
    beforeMount: function () {
        window.onhashchange=function(){
            vu._changeHash();
        };
        this._changeHash();
    },
    mounted: function(){
        this.UI.firstLoad=false;
    },
});

var dialog=relaxDialog();
var ajax=relaxAJAX({
    type: 'get',
    contentType: CFG.JDTYPE,
    formater: CFG.ajaxFormater,
    checker: CFG.ajaxReturnDo,
    before: function(){
        dialog.open('loading');
    },
    error: function(code, msg){
        dialog.close('loading');
        dialog.open('information',{
            content:msg,
            cname:'error',
            btncancel:'',
            btnclose:'',
            btnsure:'确定'
        });
    }
});

if (!EQUIPMENT.app) $('body').removeClass('app');
$(function(){
    //获得详情
    vu._getRecordDetails();

    //添加版本号
    $('.emptyShow .ver').text('V'+CFG.VER);
});
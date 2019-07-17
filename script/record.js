if (!EQUIPMENT.app) EQUIPMENT=window.parent.EQUIPMENT;  //如果是PC端访问，把EQUIPMENT重制为父框架的EQUIPMENT对象
var vu=new Vue({
    el: '#app',
    data: {
        UI: {
            firstLoad: true,
            listHeight: 100   //列表内容高度
        },
        cutpage:{
            page: 1,
            page2: 1,
            pageSize: 20,
            total: 0,
            count: 0
        },
        record: [],       //操作记录数组
        recordKey: {},    //对照表
        recordObject: {}  //操作记录详情
    },
    methods: {
        //获得操作记录
        getRecordList: function(pageNum){
            this.record=[];
            this.recordKey={};
            if (pageNum) this.cutpage.page=pageNum;
            ajax.send({
                url: PATH.recordList,
                data: {page: this.cutpage.page},
                success: function (data) {
                    dialog.close('loading');
                    //加工分页数据
                    vu.cutpage.page2=vu.cutpage.page=data.page-0;
                    vu.cutpage.count=data.pages;
                    vu.cutpage.total=data.total;
                    data=data.items;
                    for (var i=0; i<data.length; i++){
                        //加工日期时间
                        if (!data[i].updated_at){
                            data[i].updated_at=['--'];
                        }else{
                            data[i].updated_at=data[i].updated_at.split(/\s/);
                        }
                        if (data[i].updated_at.length===1) data[i].updated_at[1]='';
                        //加工合格状态
                        data[i].qualified=vu._formatQualified(data[i].qualified);
                        vu.record.push(data[i]);
                        if (!vu.recordKey[data[i]['bolt_id']]) vu.recordKey[data[i]['bolt_id']] = vu.record[i];
                    }
                },
                error:function(code,msg){
                    dialog.close('loading');
                    dialog.open('information',{content:msg, cname:'error', btncancel:'',btnclose:'',btnsure:'确定'});
                    vu.cutpage.page=vu.cutpage.page2;
                }
            });
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
        openRecordDetails: function(id){   //获得操作日志详细
            var dialogConfig={
                closeCallback: function(){
                    vu.recordDetails={};
                }
            };
            ajax.send({
                url: PATH.recordDetails,
                data: {id: id},
                success: function(data){
                    dialog.close('loading');
                    vu.recordObject=data;
                    vu.recordObject.product_code=vu.recordKey[id].product_code;
                    dialog.open('opRecordDetails',dialogConfig);
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
                }else{
                    window.parent.vu.openDetails(type,obj.bolt_id);
                }
            }
        }
    }
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
            btnsure:'确定',
            /*closeCallback: function(id, dialogType, buttonType){
                if (buttonType==='sure' && vu.UI.view==='quick'){
                    vu.$refs.searchInput.focus();
                }
            }*/
        });
    }
});

$(function(){
    vu.getRecordList();

    var timeID, body=$('body');
    $(window).resize(function(){
        if (timeID){
            clearTimeout(timeID);
            timeID='';
        }
        timeID=setTimeout(function(){
            fitUI();
        },100);
    });
    fitUI();

    function fitUI(){
        var H=body.height();
        vu.UI.listHeight=H-52;
    }
});
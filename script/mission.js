if (!EQUIPMENT.app) EQUIPMENT=window.parent.EQUIPMENT;  //如果是PC端访问，把EQUIPMENT重制为父框架的EQUIPMENT对象
var vu=new Vue({
    el: '#app',
    data: {
        UI: {
            firstLoad: true,
            listHeight: 100,   //列表内容高度
            expand: ''
        },
        cutpage: {
            page: 1,
            page2: 1,
            pageSize: 20,
            total: 0,
            count: 0
        },
        mission: [],      //入库单列表
        missionKey:{},    //id与数组索引对应关系
        childrenKey:{}
    },
    methods: {
        getList: function(){  //获得任务列表
            this.mission=[];
            this.missionKey={};
            this.childrenKey={};
            ajax.send({
                url: PATH.import,
                data:{},
                success:function(data){
                    dialog.close('loading');
                    //加工列表数据
                    for (var i=0; i<data.length; i++){
                        data[i].children=[];
                        data[i].childrenLoad=false;
                        //加工日期
                        data[i].created_at=data[i].created_at.split(' ');
                        vu.missionKey[data[i].id]=i;
                    }
                    vu.mission=data;
                },
                error:function(code,msg){
                    dialog.close('loading');
                    dialog.open('information',{content:msg, cname:'error', btncancel:'',btnclose:'',btnsure:'确定'});
                }
            });
        },
        getMissionList: function(row, event){  //获得入库单对应的检验任务
            var obj=this.mission[this.missionKey[row.id]];
            if (!obj.childrenLoad) {
                var sendData = {id: obj.id};
                ajax.send({
                    url: PATH.importDetails,
                    data: sendData,
                    success: function (data) {
                        dialog.close('loading');
                        obj.childrenLoad = true;
                        obj.children = data.bolts;
                        for (var i=0; i<data.bolts.length; i++){
                            data.bolts[i].position=data.bolts[i].position.split(REG.position);
                            vu.childrenKey[data.bolts[i].bolt_id]=data.bolts[i];
                        }
                        if (vu.UI.expand!==obj){
                            vu.$refs.myTable.toggleRowExpansion(obj);
                            if (vu.UI.expand) vu.$refs.myTable.toggleRowExpansion(vu.UI.expand);
                            vu.UI.expand=obj;
                        }
                    }
                });
            }else{
                if (vu.UI.expand===obj){
                    vu.UI.expand='';
                    vu.$refs.myTable.toggleRowExpansion(obj);
                }else{
                    vu.$refs.myTable.toggleRowExpansion(vu.UI.expand);
                    vu.$refs.myTable.toggleRowExpansion(obj);
                    vu.UI.expand=obj;
                }
            }
        },
        openDetails: function(bid){
            if (EQUIPMENT.app){
                //NOTICE 调用app对应的方法
            }else{
                window.parent.vu.openDetails('check',bid);
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
            btnsure:'确定'
        });
    }
});

$(function(){
    vu.getList();

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
        vu.UI.listHeight=H;
    }
});
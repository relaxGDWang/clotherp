if (!EQUIPMENT.app) EQUIPMENT=window.parent.EQUIPMENT;  //如果是PC端访问，把EQUIPMENT重制为父框架的EQUIPMENT对象
var vu=new Vue({
    el: '#app',
    data: {
        bolt_no:'',  //输入/扫描的布匹卷号
        opType:'',  //区分裁剪还是检验
        searchResult:[],  //搜索结果列表
    },
    methods: {
        //快速检验输入框应对
        changeSearchNumber: function(e){
            var dialogCfg={btncancel:'', btnclose:'', btnsure:'确定'};
            if (e===undefined || e.keyCode===13){
                this.bolt_no=this.bolt_no.replace(/00\s/,'');
                if (!this.bolt_no){
                    dialogCfg.cname='warning';
                    dialogCfg.content='请填写需要查询的布匹卷号！';
                    dialog.open('information',dialogCfg);
                }else{
                    this.searchResult=[];
                    if (e) e.target.blur();
                    ajax.send({
                        url: PATH.missionCheck,
                        data: {bolt_no: this.bolt_no},
                        success:function(data){
                            dialog.close('loading');
                            data=data.items;
                            if (data.length===0){
                                dialogCfg.cname='sure';
                                dialogCfg.content='没有找到对应的布卷信息';
                                dialog.open('information',dialogCfg);
                            }else{
                                //显示列表
                                for (var i=0; i<data.length; i++){
                                    data[i].position=data[i].position.split(REG.position);
                                }
                                vu.searchResult=data;
                                //如果只有1条记录，则自动打开详情页
                                if (data.length===1) vu.openDetails(data[0].bolt_id);
                            }
                        }
                    });
                }
            }
        },
        _changeHash: function(){
            var hash=location.hash.replace(/^#/,'');
            this.opType=hash==='cut'? 'cut':'check';
            this.clearSearchNumber();
        },
        clearSearchNumber: function(){  //清除当前的查询结果和查询关键字
            this.bolt_no='';
            this.searchResult=[];
        },
        openDetails: function(bid){   //打开检验/裁剪的操作详情对话框
            if (EQUIPMENT.app){
                //NOTICE 调用app对应的方法
            }else{
                var opType=this.opType;
                window.parent.vu.openDetails(opType,bid);
            }
        }
    },
    beforeMount: function(){
        window.onhashchange=function(){
            vu._changeHash();
        };
        this._changeHash();
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
            closeCallback: function(id, dialogType, buttonType){
                if (buttonType==='sure' && vu.UI.view==='quick'){
                    vu.$refs.searchInput.focus();
                }
            }
        });
    }
});
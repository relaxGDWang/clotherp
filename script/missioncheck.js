var REG={
    flaw: /^\d{1,3}(\.\d{1,2})?$/
};
var vu=new Vue({
    el: '#app',
    data:{
        search:{
            listType: 'doing'   //doing,finished
        },
        username: '',
        UI:{
            listHeight: 100,
            bottomListHeight: 100,
            len: 0,
            perLen: 10,
            direction: 'right'
        },
        input:{
            flag: false,  //标记修改操作的ajax是否在提交
            msg:'',        //错误信息提示
            status: '',    //错误信息状态
            len: '',       //修正布长
            start:'',      //疵点开始
            end:'',        //疵点结束
            step:1         //步骤
        },
        editObject: '',
        mission: [],    //任务细分数组，ajax直接返回
        missionKey: {}, //bolt_id与数组index对应关系
        clothDetails: {}  //布匹的裁剪任务，以bolt_no作为索引，结构 defects[疵点列表数组] cutouts[事件记录数组] splits[裁剪分段数组] list[以bolt_id作为索引的对象，值为splits的数组index] first[起始裁剪bolt_id] viewObj[当前查看的分段信息] product[对应的商品编号]
    },
    computed:{
        getMark: function(){
            var loopCount=Math.ceil(this.UI.len/this.UI.perLen);
            var result=[];
            for (var i=0; i<loopCount; i++){
                result.push(i*this.UI.perLen);
            }
            result.push(this.UI.len);
            return result;
        }
    },
    methods:{
        getList: function(){  //获得任务列表
            ajax.send({
                url: PATH.missionCheck,
                data:{status: this.search.listType},
                success:function(data){
                    dialog.close('loading');
                    vu.mission=[];
                    for (var i=0; i<data.length; i++){
                        vu.mission.push(data[i]);
                        vu.missionKey[data[i]['bolt_id']]=i;
                    }
                }
            });
        },
        //bid 每个裁剪分段的编号 bno 每个布匹的编号
        openDetails: function(bid){
            var keyStr=this.mission[this.missionKey[bid]].bolt_no;
            var dialogConfig={
                openCallback: function(){
                    setTimeout(function(){
                        vu.redrawCloth();
                    },100);
                },
                closeCallback: function(){
                    vu.editObject='';
                }
            };
            if (this.clothDetails[keyStr]!==undefined){
                this.editObject=this.clothDetails[keyStr];
                this._setColthLen();
                dialog.open('opDetails',dialogConfig);
            }else{
                ajax.send({
                    url: PATH.missionCheckDetails,
                    data:{bolt_id: bid},
                    success:function(data){
                        dialog.close('loading');
                        var keyStr=data.bolt_no;
                        var bidStr=data.bolt_id;
                        vu._solveCutData(keyStr, data);
                        vu.editObject=vu.clothDetails[keyStr];
                        vu._setColthLen();
                        dialog.open('opDetails',dialogConfig);
                    }
                });
            }
        },
        _solveCutData: function(key, data){  //按详细信息加工成可界面处理数据
            var temp=this.clothDetails[key], i;
            if (!temp) temp=this.clothDetails[key]={};
            temp.defects=data.defects;
            temp.cutouts=data.cutouts;
            temp.viewObj=this.mission[this.missionKey[data.bolt_id]];
        },
        _setColthLen: function(){   //设置用于显示的当前布长
            if (this.editObject){
                this.UI.len=this.editObject.viewObj.current_length;
                return;
            }
            this.UI.len=0;
        },
        getTypeString: function(itemObject){   //获得当前裁剪端的分类名称
            if (itemObject.order){
                return 'customer';
            }else if(itemObject.defect_type && itemObject.defect_type.indexOf('瑕疵')>=0){
                return 'flaw';
            }else{
                return 'normal';
            }
        },
        askFinish: function(){
            //检测完整性
            dialog.open('information',{
                content: '是否完成当前裁剪操作？',
                closeCallback: function(id, dialogType, buttonType){
                    if (buttonType==='sure') vu.doFinish();
                }
            });
        },
        doFinish: function(){
            ajax.send({
                url: PATH.missionCutFinished,
                method: 'post',
                data:{bolt_id: vu.editObject.viewObj.bolt_id},
                success:function(data){
                    dialog.close('loading');
                    //删除任务列表中的对应项
                    var id=vu.editObject.viewObj.bolt_id;
                    var index=vu.missionKey[id];
                    vu.mission.splice(index,1);
                    delete vu.missionKey[id];
                    var keyStr=data.bolt_no;
                    var bidStr=data.bolt_id;
                    if (data.splits.length===0){
                        delete vu.clothDetails[keyStr];
                        vu.editObject='';
                        dialog.open('information',{
                            content: '当前布匹上的裁剪任务已经全部处理完毕!',
                            closeCallback: function(){
                                dialog.close('opDetails');
                            }
                        });
                        return;
                    }
                    vu._solveCutData(keyStr, data);
                    vu.editObject=vu.clothDetails[keyStr];
                    vu.setViewObject(vu.editObject, '');
                    vu._setColthLen();
                    dialog.open('resultShow',{content:'当前裁剪操作已成功！'});
                    //重新绘制概览图
                    setTimeout(function(){
                        vu.redrawCloth();
                    },100);
                }
            });
        },
        resetLength: function(){  //重写布匹长度操作
            if (!this.editObject) return;
            dialog.open('reLength',{
                closeCallback: function(){
                    vu.input.len='';
                    vu.input.flag=false;
                    vu.input.status='';
                    vu.input.msg='';
                }
            });
        },
        doResetLength: function(){ //重写布匹长度ajax
            ajaxModify.send({
                url: PATH.resetLength,
                method: 'post',
                data:{bolt_id: vu.editObject.viewObj.bolt_id, length: vu.input.len},
                success: function(data){
                    //调整布长
                    vu.editObject.viewObj.current_length=vu.input.len;
                    vu._setMessage({flag:true, status:'ok', msg:'布长已经成功标记为'+vu.input.len});
                    setTimeout(function(){
                        dialog.close('reLength');
                        vu.input.len='';
                        vu.input.flag=false;
                        vu.input.status='';
                        vu.input.msg='';
                    },2000);
                }
            });
        },
        operateFlaw: function(id){  //添加疵点操作
            if (id===undefined){
                dialog.open('addFlaw',{
                    closeCallback: function(){
                        vu.input.start='';
                        vu.input.end='';
                        vu.input.step=1;
                        vu.input.flag=false;
                        vu.input.status='';
                        vu.input.msg=''
                    }
                });
            }
        },
        goStep: function(op){   //分步骤展现操作
            switch(op){
                case 'next':
                    if (REG.flaw.test(this.input.start)===false){
                        this._setMessage({status:'warning',msg:'疵点开始位置填写有误'});
                        return;
                    }
                    if (this.input.start>this.editObject.viewObj.current_length){
                        this._setMessage({status:'warning',msg:'疵点开始位置大于布长，请重新输入'});
                        return;
                    }
                    this.input.step=2;
                    this.input.end=this.input.start;
                    break
                case 'prev':
                    this.input.step=1;
                    break;
            }
        },
        doOperateFlaw: function(){ //添加疵点ajax
            if (REG.flaw.test(this.input.end)===false){
                this._setMessage({status:'warning',msg:'疵点结束位置填写有误'});
                return;
            }
            if (this.input.end>this.editObject.viewObj.current_length){
                this._setMessage({status:'warning',msg:'疵点结束位置大于布长，请重新输入'});
                return;
            }
            ajaxModify.send({
                url: PATH.addFlaw,
                method: 'post',
                data:{bolt_id: vu.editObject.viewObj.bolt_id, defects:[vu.input.start+","+vu.input.end]},
                success: function(data){
                    vu.editObject.defects=data;  //刷新疵点列表
                    vu._setMessage({flag:true, status:'ok', msg:'新增疵点已经成功！'});
                    setTimeout(function(){
                        dialog.close('addFlaw');
                        vu.input.start='';
                        vu.input.end='';
                        vu.input.step=1;
                        vu.input.flag=false;
                        vu.input.status='';
                        vu.input.msg='';
                        vu.redrawCloth();
                    },2000);
                }
            });
        },
        redrawCloth: function(){  //绘制布匹概览
            var len=$('#cloth').width()-1;
            var pm=len/this.UI.len;
            var tempArray=$('#ruler span');
            var direction=this.UI.direction;
            var i,pos1,pos2,widthNum;
            for (i=0; i<tempArray.length; i++){
                pos1=$(tempArray[i]).attr('pos');
                $(tempArray[i]).css(direction, pm*pos1);
            }
            tempArray=$('#cloth .flaw');
            for (i=0; i<tempArray.length; i++){
                pos1=$(tempArray[i]).attr('start');
                pos2=$(tempArray[i]).attr('end');
                widthNum=(pos2-pos1)*pm || 1;
                $(tempArray[i]).css(direction, pm*pos1).css('width', widthNum);
            }
        },
        _setMessage: function(config){
            this.input.flag=config.flag || false;
            this.input.status=config.status || '';
            this.input.msg=config.msg || '';
        },
        operateBefore: function(){  //用于设置操作的ajax before的设置
            this._setMessage({flag:true,status:'loading',msg:'正在提交设置数据，请稍等...'});
        },
        operateError: function(code, msg){
            this._setMessage({status:'error', msg:msg});
        }
    },
    beforeMount: function () {
        var temp=JSON.parse(localStorage.getItem(CFG.admin));
        this.username=temp.name;
    },
    watch: {
        'input.len': function(newVal){
            this.input.status='';
            this.input.msg='';
        },
        'input.start': function(newVal){
            this.input.status='';
            this.input.msg='';
        },
        'input.end': function(newVal){
            this.input.status='';
            this.input.msg='';
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
        dialog.open('information',{content:msg});
    }
});
var ajaxModify=relaxAJAX({
    contentType: CFG.JDTYPE,
    formater: CFG.ajaxFormater,
    checker: CFG.ajaxReturnDo,
    before: vu.operateBefore,
    error: vu.operateError
});

$(function(){
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
    fitUI('first');
    vu.getList();

    function fitUI(flag){
        var H=body.height();
        vu.UI.listHeight=H-70;
        vu.UI.bottomListHeight=H-615;
        if (flag===undefined){
            vu.redrawCloth();
        }
    }
});

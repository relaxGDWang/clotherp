var vu=new Vue({
    el: '#app',
    data:{
        search:{
            listType: 'doing'   //doing,finished
        },
        username: '',
        UI:{
            listHeight: 100,
        },
        editObject: {},
        mission: [],
        keyIndex:{}
    },
    methods:{
        openDetails: function(index){
            if (this.keyIndex[index].flag){
                this.editObject=this.mission[this.keyIndex[index].index];
                dialog.open('opDetails',{closeCallback:function(){
                    vu.editObject={};
                }});
            }else{
                ajax.send({
                    url: PATH.missionCut+'/'+index,
                    data:{status: this.search.listType},
                    error: function(){
                        dialog.close('loading');
                    },
                    success:function(data){
                        dialog.close('loading');
                        var keyObject=vu.keyIndex[data.bolt_id];
                        keyObject.flag=true;
                        vu.mission[keyObject.index].details=data;
                        vu.editObject=vu.mission[keyObject.index];
                        dialog.open('opDetails',{closeCallback:function(){
                            vu.editObject={};
                        }});
                    }
                });
            }
        },
        tableRowClassName: function({row, rowIndex}){
            if (row.id===this.nowEdit){
                return 'sel';
            }else{
                return '';
            }
        },
        getList: function(){  //获得任务列表
            ajax.send({
                url: PATH.missionCut,
                data:{status: this.search.listType},
                error: function(){
                    dialog.close('loading');
                },
                success:function(data){
                    dialog.close('loading');
                    vu.mission=[];
                    for (var i=0; i<data.length; i++){
                        DFG.solve('cutlist', data[i]);
                        vu.mission.push(data[i]);
                        vu.keyIndex[data[i]['bolt_id']]={
                            index: i,
                            flag: false,
                        };
                    }
                }
            });
        },
        redrawCloth: function(){  //绘制布匹概览
            var len=$('#cloth').width()-1;
            var pm=len/this.len;
            var tempArray=$('#ruler span');
            var direction=this.direction;
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
        }
    },
    beforeMount: function () {
        var temp=JSON.parse(localStorage.getItem(CFG.admin));
        this.username=temp.name;
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
    }
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
    fitUI();
    vu.getList();

    function fitUI(){
        vu.UI.listHeight=body.height()-70;
    }
});

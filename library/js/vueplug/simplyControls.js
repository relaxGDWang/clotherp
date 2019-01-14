//utf8
/*
简易VUE组件
*/
//图标输入框
//外抛事件接口
//eventbind 父对象使用请书写 @eventbind=...
//focus 获得焦点事件
//blur 失去焦点事件
Vue.component('input-icon',{
    template:'<span class="rexIconInput" :color="color">' +
        '<span class="fa" :class="iconLeft" v-if="iconLeft" @click="eventIconBtn($event)"></span>' +
        '<span class="fa fa-times cleanBtn" v-if="!iconLeft && iconRight && ext===\'del\'" @click="cleanValue()"></span>' +
        '<span class="fa fa-eye appearBtn" v-if="!iconLeft && iconRight && ext===\'appear\'" @click="changeStatus($event)"></span>' +
        '<input :type="type" :value="value" :class="{idtLeft:haveLeft,idtRight:haveRight}" @input="$emit(\'input\', $event.target.value)" ref="input" :maxlength="maxlength" :placeholder="placeholder" @focus="inputFocus($event)" @blur="inputBlur($event)"/>' +
        '<span class="fa fa-eye appearBtn" v-if="!iconRight && ext===\'appear\'" @click="changeStatus($event)"></span>' +
        '<span class="fa fa-times cleanBtn" v-if="!iconRight && ext===\'del\'" @click="cleanValue()"></span>' +
        '<span class="fa" :class="iconRight" v-if="iconRight" @click="eventIconBtn($event)"></span>' +
        '</span>',
    props:{
        value:'',        //输入框初始值
        type: 'text',    //输入框类型，默认文本输入框
        color: '',       //颜色设定
        placeholder:'',  //输入框placeholder的值
        maxlength:'',    //最大输入位数
        iconLeft:'',     //左侧图标
        iconRight:'',    //右侧图标
        ext:''           //扩展功能 del输入框可删除, appear密码框可见
    },
    computed:{
        haveLeft: function(){
            if (!this.iconLeft) return false;
            return !(this.iconLeft.indexOf('sp')===-1);
        },
        haveRight: function(){
            if (!this.iconRight) return false;
            return !(this.iconRight.indexOf('sp')===-1);
        }
    },
    methods:{
        inputFocus: function(e){
            e.target.parentElement.className='rexIconInput active';  //设置选中样式
            if (this.ext==='appear'){  //密码框的情况，则全选文本
                setTimeout(function(){
                    e.target.select();
                },50);
            }
            this.$emit('focus');
        },
        inputBlur: function(e){
            e.target.parentElement.className='rexIconInput';
            this.$emit('blur');
        },
        cleanValue: function(){   //清除输入内容
            this.$emit('input','');
            this.$refs['input'].focus();
        },
        changeStatus: function(e){   //变更密码可见性
            var temp=this.$refs['input'];
            var nowAttr=temp.getAttribute('type');
            if (nowAttr==='text'){
                temp.setAttribute('type','password');
                e.target.className='fa appearBtn fa-eye';
            }else{
                temp.setAttribute('type','text');
                e.target.className='fa appearBtn fa-eye-slash';
            }
            this.$refs['input'].focus();
        },
        eventIconBtn: function(e){  //如果父组件绑定事件，点击图标调用该事件
            this.$emit('eventbind');
            this._protectEvent(e);
        },
        _protectEvent: function(e){
            //禁止冒泡
            if (e && e.stopPropagation){
                e.stopPropagation();
            }else{
                window.event.cancelBubble = true;
            }
            //禁止默认事件
            if (e && e.preventDefault){
                e.preventDefault();
            }else{
                window.event.returnValue = false;
                return false;
            }
        }
    }
});
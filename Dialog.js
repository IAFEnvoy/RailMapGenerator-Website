class Dialog {
    /**
     * 创建一个对话框
     * @param {String} title 
     */
    constructor(title) {
        this.title = title;
        this.context = new Array();
        this.result = new Array();
    }
    /**
     * 添加一个输入框
     * @param {String} id 唯一标识符
     * @param {String} text 显示的内容
     * @param {String} type Input的类型
     */
    AddContext(id, text, defaultValue, type) {
        this.context.push({ id: id, label: text, type: type, defaultValue: defaultValue });
    }
    /**
     * 显示对话框
     * @param {function} callback 回调函数
     */
    ShowDialog(callback) {
        //模糊背景
        let bg = document.createElement("div");
        bg.className = "dialog-background";
        document.body.appendChild(bg);
        let dialog = document.createElement('div');
        dialog.className = 'dialog';
        //set size to 400x300
        dialog.style.width = 'auto';
        dialog.style.height = 'auto';
        //title
        let title = document.createElement('h3');
        title.className = 'title';
        title.innerHTML = this.title;
        title.style.margin='10px';
        dialog.appendChild(title);
        //for each context in this.context, show a label and a input field
        this.context.forEach(context => {
            let label = document.createElement('label');
            label.className = 'label';
            label.innerHTML = context.label + '';
            label.style.margin = '5px';
            dialog.appendChild(label);
            let input = document.createElement('input');
            input.className = 'input';
            input.value = '';
            input.id = context.id;
            input.style.margin = '5px';
            if (context.defaultValue != undefined)
                input.value = context.defaultValue;
            if (context.type != undefined)
                input.type = context.type;
            dialog.appendChild(input);
            dialog.appendChild(document.createElement('br'));
        });
        //add ok and cancel button
        let ok = document.createElement('button');
        ok.innerHTML = '确定';
        ok.style.margin = '5px';
        dialog.appendChild(ok);
        let cancel = document.createElement('button');
        cancel.innerHTML = '取消';
        cancel.style.margin = '5px';
        dialog.appendChild(cancel);
        //set to center
        dialog.style.left = `${(window.innerWidth - 300) / 2}px`;
        dialog.style.top = `${(window.innerHeight - 200) / 2}px`;
        //show dialog
        bg.appendChild(dialog);
        //bind event
        ok.onclick = () => {
            let result = new Array();
            this.context.forEach(context => {
                result.push({ id: context.id, value: document.getElementById(context.id).value });
            });
            document.body.removeChild(bg);
            callback(result);
        }
        cancel.onclick = () => {
            document.body.removeChild(bg);
        }
    }
}

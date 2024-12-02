function Validator(formSelector) {

    var formRules = {};
    var _this = this;

    // Nguyên tắc là đứng ở vị trí đang có nhảy ra ngoài tìm 
    // Check xem có trùng class hay không nếu trùng thì return lại chính element
    // Nếu không trùng thì nhảy ra ngoài tìm đến khi nào hết thì thôi

    function getParent(element, selector){
        
        while(element.parentElement) {
            if(element.parentElement.matches(selector)){
                return element.parentElement;
            }

            element = element.parentElement;
        }
    }


    /**
    * Quy ước tạo rules:
    * - Nếu có lỗi thì return 'error message'
    * - Nếu không có lỗi thì return 'undefine'

     */

    var validatorRules = {
        required: function(value){
            return value ? undefined : 'Vui lòng nhập trường này';
        },
        email: function(value){
            var regex = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/;
            // Biểu thức chính quy để kiểm tra email
            return regex.test(value) ? undefined : 'Vui lòng nhập email';
        },
            // Tạo function lồng nhau
        min: function(min){
            return function(value){
                return value.length >= min ? undefined : `Vui lòng nhập ít nhất ${min} kí tự` ;
            }
        },
        max: function(max){
            return function(value){
                return value.length <= max ? undefined : `Vui lòng nhập tối đa ${max} kí tự` ;
            }
        },
    };


    // Lấy ra form element trong DOM theo 'formSelector'
    var formElement = document.querySelector(formSelector);

    //Chỉ sử lý khi có element trong DOM
    if(formElement){

        var inputs = formElement.querySelectorAll('[name][rules]');

        for(var input of inputs){

            //Đoạn này tách chuổi required|email,... bằng split('|')
            var rules = input.getAttribute('rules').split('|');

            //Lặp qua và lấy từng phần tử của mảng đã được tách
            for(var rule of rules){

                var ruleInfo;
                var isRuleHasValue = rule.includes(':');

                if(isRuleHasValue){
                    ruleInfo = rule.split(':');

                    //Gán đè rule bằng ruleInfo[0] là chữ min
                    rule = ruleInfo[0];
                    //Số 6 là ruleInfo[1];
                }    

                var ruleFunc = validatorRules[rule];

                if(isRuleHasValue){
                    //Này kiểm tra nó có 2 chấm thì sẽ gán số 6 vào ruleFunc
                    ruleFunc = ruleFunc(ruleInfo[1]);
                }

                // Này là để kiếm ra có phải là array hay không
                if(Array.isArray(formRules[input.name])){
                    // Lần thứ 2 nó sẽ lọt vào đây vì nó là array rồi 
                    // Chúng ta sẽ push nó vào
                    formRules[input.name].push(ruleFunc);
                }
                // Lần đầu tiên nó sẽ lọt vào else vì hiện nó đang là object
                else{
                    // Đưa function validatorRules vào mảng
                    formRules[input.name] = [ruleFunc];
                }

            }

            // Lắng nghe sự kiện để validate(blur, change, ....)
            input.onblur = handleValidate;
            input.oninput = handleClearError;
            
        }

        // Hàm thực hiện validate
        function handleValidate(event) {
            var rules = formRules[event.target.name];
            var errorMessage;

            for(var rule of rules){
                errorMessage = rule(event.target.value);
                if(errorMessage) break;
            }

            //Nếu có lỗi thì hiển thị message lỗi ra UI
            if(errorMessage){
                var formGroup = getParent(event.target, '.form-group');

                if(formGroup) {
                    formGroup.classList.add('invalid');


                    var formMessage = formGroup.querySelector('.form-message');
                    if(formMessage){
                        formMessage.innerText = errorMessage;
                    }
                }
            }
            return !errorMessage;
        }

        //Hàm clear message lỗi
        function handleClearError(event) {
            var formGroup = getParent(event.target, '.form-group');

            if(formGroup.classList.contains('invalid')){
                formGroup.classList.remove('invalid');

                var formMessage = formGroup.querySelector('.form-message');
                if(formMessage){
                    formMessage.innerText = '';
                }
            }
        }
    }

    //Xử lý hành vi submit form 
    formElement.onsubmit = function(event) {
        event.preventDefault();


        var inputs = formElement.querySelectorAll('[name][rules]');
        var isValid = true;

        for(var input of inputs){
            if(!handleValidate({target: input})){
                isValid = false;
            }
        }  

        //Khi không có lỗi thì submit form
        if(isValid) {

            if(typeof _this.onSubmit === 'function'){

                //Biến này select tất cả các field (trường) có attribute là name và không có attribute là disabled
                var enableInputs = formElement.querySelectorAll('[name]');

                var formValues = Array.from(enableInputs).reduce((values, input) => {
                    
                    switch(input.type){
                        case 'radio':
                            values[input.name] = formElement.querySelector('input[name="' + input.name + '"]:checked').value;
                            break;
                        case 'checkbox':
                        if(!input.matches(':checked')){
                            values[input.name] = '';
                            return values;
                        }
                            if(!Array.isArray(values[input.name])){
                                values[input.name] = [];
                            }
                            values[input.name].push(input.value);
                            break;
                        case 'file':
                            values[input.name] = input.files;
                            break;
                        default:
                            values[input.name] = input.value;
                    }
                    return values;
                }, {});

                //Gọi lại hàm onSubmit và trả về kèm giá trị của form
                _this.onSubmit(formValues);
            }
            else{
                formElement.submit();
            }
        }
    }
}
/**
 * Created by oscar on 01/08/2016.
 */

$(document).ready(function() {
    $('.datepicker').each(function() {
        var input = $(this);
        var data = input.data();

        var options = { };

        if(data.dates) {
            options.disable = [
                true
            ];

            data.dates.forEach(function(date) {
                options.disable.push(new Date(date));
            });
        }

        options.onClose = function() {
            var form = input.prop('form');
            if(form) {
                form.submit();
            }
        };

        input.pickadate(options);
    });

    $('.ui.filter.form select').change(function() {
        var form = $(this).prop('form');
        if(form) {
            form.submit();
        }
    });
});
/* TOTP (Authenticator demo) */

var timeStep = 30;

$(function () {
    updateOtp();

    $('#secret').keyup(function () {
        updateOtp();
    });
    
    setInterval(timer, 1000);
});

function timer() {
    var epoch = Math.round(new Date().getTime() / 1000.0);
    var countDown = timeStep - (epoch % timeStep);
    if (countDown == timeStep) updateOtp();
    $('#updatingIn').text(countDown);
}

function updateOtp() {
        
    var key = base32tohex($('#secret').val());
    var epoch = Math.round(new Date().getTime() / 1000.0);
    var time = leftpad(dec2hex(Math.floor(epoch / timeStep)), 16, '0');

    $('#qrImg').attr('src', 'https://chart.googleapis.com/chart?chs=200x200&cht=qr&chl=200x200&chld=M|0&cht=qr&chl=otpauth://totp/user@host.com%3Fsecret%3D' + $('#secret').val());
    $('#secretHex').text(key);
    $('#secretHexLength').text(key.length * 4 + ' bits'); 
    $('#epoch').text(time);
    $('#hmac').empty();

    // updated for jsSHA v2.0.0 - http://caligatio.github.io/jsSHA/
    var shaObj = new jsSHA("SHA-256", "HEX");
    shaObj.setHMACKey(key, "HEX");
    shaObj.update(time);

    var hmac = shaObj.getHMAC("HEX");
    if (hmac == 'KEY MUST BE IN BYTE INCREMENTS') {
        labelAppend('important', hmac);

    } else {
        // offset is the value of the last hex digit (half byte) of hmac
        var offset = hex2dec(hmac.substring(hmac.length - 1));
        
        var part1 = hmac.substr(0, offset * 2);
        if (part1.length > 0 )
            labelAppend('label-default', part1);

        var part2 = hmac.substr(offset * 2, 8);
        labelAppend('label-primary', part2);

        var part3 = hmac.substr(offset * 2 + 8, hmac.length - offset);
        if (part3.length > 0)
            labelAppend('label-default', part3);

        // var otp = hex2dec(part2);
        $('#otp').text(hex2dec(part2) % 1000000);
    }
}

function labelAppend(label, part) {
    $('#hmac').append($('<span/>')
        .attr('style','padding-left:0;padding-right:0;font-family:Lucida Console;')
        .addClass('label ' + label)
        .append(part));
}

function dec2hex(s) { return (s < 15.5 ? '0' : '') + Math.round(s).toString(16); }

function hex2dec(s) { return Math.abs(parseInt(s, 16)); }

function base32tohex(base32) {
    var base32chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
    var bits = "";
    var hex = "";

    for (var character of base32) {
        var val = base32chars.indexOf(character.toUpperCase());
        bits = bits + leftpad(val.toString(2), 5, '0');
    }

    for (var i = 0; i <= bits.length - 4; i+=4) {
        var chunk = bits.substr(i, 4);
        hex = hex + parseInt(chunk, 2).toString(16) ;
    }
    return hex;
}

function leftpad(str, len, pad) {
    if (len + 1 >= str.length) {
        str = Array(len + 1 - str.length).join(pad) + str;
    }
    return str;
}

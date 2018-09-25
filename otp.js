/* BOTP (Blockchain authenticator demo) */

  
$(function () {
    updateOtp();

    $('#update').click(function () {
        updateOtp();
    });

    $('#blockchain').change(function () {
        updateOtp();
    });

    // setInterval(timer, 5000);
});

var timeStep = 10;

function timer() {
    var epoch = Math.round(new Date().getTime() / 1000.0);
    var countDown = timeStep - (epoch % timeStep);
    if (countDown == timeStep) updateOtp();    
}

function updateOtp() {
        
    var key = base32tohex( $('#secret').val() );
    var configURI = 'otpauth://botp/' + $('#userAtServer').val() + '?secret=' + $('#secret').val();

    $('#secretHex').text(key);
    $('#secretHexLength').text(key.length * 4 + ' bits'); 
    $('#configURI').text(configURI);
    $('#qrImg').attr('src', 
        'https://chart.googleapis.com/chart?chs=200x200&cht=qr&chl=200x200&chld=M|0&cht=qr&chl=' 
        + configURI);
    $('#hmac').empty();

    // updated for jsSHA v2.0.0 - http://caligatio.github.io/jsSHA/
    var shaObj = new jsSHA("SHA3-256", "HEX");  // SHA-3 used (keccak)
    try {
        shaObj.setHMACKey(key, "HEX");

        var blockchain = $('#blockchain').val();
        console.log(blockchain);
        
        $.get( "https://api.blockcypher.com/v1/" + blockchain + "/main", function( result ) {
            var latestBlock = JSON.parse(result);
            
            console.log(latestBlock.hash);
            $('#blockhash').text('0x' + latestBlock.hash);
            shaObj.update(latestBlock.hash);

            $('#blockcount').text(latestBlock.height);

            var hmac = shaObj.getHMAC("HEX");
                
            // offset is the value of the last hex digit (half byte) of hmac
            var offset = hex2dec(hmac.substring(hmac.length - 1));
            
            var part1 = hmac.substr(0, offset * 2);
            var part2 = hmac.substr(offset * 2, 8);
            var part3 = hmac.substr(offset * 2 + 8, hmac.length - offset);

            labelAppend('label-default', part1);
            labelAppend('label-primary', part2);
            labelAppend('label-default', part3);

            $('#otp').text(hex2dec(part2) % 1000000);
            
        }, "text");
    }
    catch(err) {
        labelAppend('label-primary', err.message);
        $('#otp').text("");
        console.log(err.message);
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

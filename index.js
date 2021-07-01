"use strict";
window.onload = function () {
    var fragmentShaderSourceUpdateDelay = window.screen.width > 768 ? 600 : 1200;
    function showAlert(message) {
        var alerts = document.getElementsByClassName('alert');
        if (alerts.length !== 0)
            for (var _i = 0, alerts_1 = alerts; _i < alerts_1.length; _i++) {
                var item = alerts_1[_i];
                item.remove();
            }
        var outer_div = document.createElement('div'), inner_div = document.createElement('div');
        outer_div.classList.add('alert');
        inner_div.classList.add('alert_content');
        inner_div.innerText = "Error: " + message;
        outer_div.appendChild(inner_div);
        document.body.appendChild(outer_div);
    }
    function error(message) {
        showAlert(message);
        throw new Error(message);
    }
    var textarea = document.getElementById("i");
    if (textarea === null) {
        error("Textarea element was not found");
    }
    textarea.value = "#version 300 es\nprecision highp float;\n\nuniform float u_time;\nout vec4 outColor;\n\nvoid main() {\n    outColor = vec4(0.0, sin(gl_FragCoord.x / gl_FragCoord.z * gl_FragCoord.y + u_time * 10.0), 0.0, 1.0);\n}\n";
    var canvas = document.getElementById("c");
    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;
    var gl = canvas.getContext("webgl2");
    if (gl === null) {
        error("webgl2 is not supported");
    }
    function createShader(gl, type, source) {
        var shader = gl.createShader(type);
        if (shader === null) {
            error("shader compilation failed");
        }
        gl.shaderSource(shader, source);
        gl.compileShader(shader);
        var success = gl.getShaderParameter(shader, gl.COMPILE_STATUS);
        if (success) {
            return shader;
        }
        console.log(gl.getShaderInfoLog(shader));
        gl.deleteShader(shader);
    }
    function createProgram(gl, vertexShader, fragmentShader) {
        var program = gl.createProgram();
        if (program === null) {
            error("program creation failed");
        }
        gl.attachShader(program, vertexShader);
        gl.attachShader(program, fragmentShader);
        gl.linkProgram(program);
        var success = gl.getProgramParameter(program, gl.LINK_STATUS);
        if (success) {
            return program;
        }
        console.log(gl.getProgramInfoLog(program));
        gl.deleteProgram(program);
    }
    var vertexShaderSource = "#version 300 es\nin vec4 a_position;\n\nvoid main() {\n  gl_Position = a_position;\n}\n";
    var fragmentShaderSource = textarea.value;
    var vertexShader = createShader(gl, gl.VERTEX_SHADER, vertexShaderSource);
    var fragmentShader = createShader(gl, gl.FRAGMENT_SHADER, fragmentShaderSource);
    if (vertexShader === undefined) {
        error("vertex shader compilation failed");
    }
    if (fragmentShader === undefined) {
        error("fragment shader compilation failed");
    }
    var program = createProgram(gl, vertexShader, fragmentShader);
    if (program === undefined) {
        error("program creation failed");
    }
    var timeLocation = gl.getUniformLocation(program, "u_time");
    var positionAttributeLocation = gl.getAttribLocation(program, "a_position");
    var positionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1.0, -1.0, -1.0, 1.0, 1.0, 0]), gl.STATIC_DRAW);
    var vao = gl.createVertexArray();
    gl.bindVertexArray(vao);
    gl.enableVertexAttribArray(positionAttributeLocation);
    gl.vertexAttribPointer(positionAttributeLocation, 2, gl.FLOAT, false, 0, 0);
    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
    gl.useProgram(program);
    function renderLoop(timeStamp) {
        gl.uniform1f(timeLocation, timeStamp / 1000.0);
        gl.clearColor(0, 0, 0, 0);
        gl.clear(gl.COLOR_BUFFER_BIT);
        gl.drawArrays(gl.TRIANGLES, 0, 3);
        window.requestAnimationFrame(renderLoop);
    }
    var delayTimer;
    textarea.addEventListener('input', function () {
        clearTimeout(delayTimer);
        delayTimer = setTimeout(function () {
            var fragmentShaderSource = textarea.value;
            var fragmentShader = createShader(gl, gl.FRAGMENT_SHADER, fragmentShaderSource);
            if (fragmentShader === undefined) {
                error("fragment shader compilation failed");
            }
            if (program !== undefined) {
                gl.deleteProgram(program);
            }
            program = createProgram(gl, vertexShader, fragmentShader);
            if (program === undefined) {
                error("program creation failed");
            }
            timeLocation = gl.getUniformLocation(program, "u_time");
            positionAttributeLocation = gl.getAttribLocation(program, "a_position");
            gl.useProgram(program);
        }, fragmentShaderSourceUpdateDelay);
    });
    window.requestAnimationFrame(renderLoop);
};

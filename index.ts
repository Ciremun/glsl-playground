window.onload = () => {

    const fragmentShaderSourceUpdateDelay = window.screen.width > 768 ? 600 : 1200;

    function showAlert(message: string) {
        let alerts: any = document.getElementsByClassName('alert');
        if (alerts.length !== 0)
            for (let item of alerts)
                item.remove();
        let outer_div = document.createElement('div'),
            inner_div = document.createElement('div');
        outer_div.classList.add('alert');
        inner_div.classList.add('alert_content');
        inner_div.innerText = `Error: ${message}`;
        outer_div.appendChild(inner_div);
        document.body.appendChild(outer_div);
    }

    function error(message: string): never {
        showAlert(message);
        throw new Error(message);
    }

    const textarea = document.getElementById("i") as HTMLInputElement;
    if (textarea === null) {
        error("Textarea element was not found");
    }

    textarea.value = `#version 300 es
precision highp float;

uniform float u_time;
out vec4 outColor;

void main() {
    outColor = vec4(0.0, sin(gl_FragCoord.x / gl_FragCoord.z * gl_FragCoord.y + u_time * 10.0), 0.0, 1.0);
}
`;

    const canvas = document.getElementById("c") as HTMLCanvasElement;
    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;

    const gl = canvas.getContext("webgl2");
    if (gl === null) {
        error("webgl2 is not supported");
    }

    function createShader(gl: WebGL2RenderingContext, type: number, source: string) {
        const shader = gl.createShader(type);
        if (shader === null) {
            error("shader compilation failed");
        }
        gl.shaderSource(shader, source);
        gl.compileShader(shader);
        const success = gl.getShaderParameter(shader, gl.COMPILE_STATUS);
        if (success) {
            return shader;
        }
        console.log(gl.getShaderInfoLog(shader));
        gl.deleteShader(shader);
    }

    function createProgram(gl: WebGL2RenderingContext, vertexShader: WebGLShader, fragmentShader: WebGLShader) {
        const program = gl.createProgram();
        if (program === null) {
            error("program creation failed");
        }
        gl.attachShader(program, vertexShader);
        gl.attachShader(program, fragmentShader);
        gl.linkProgram(program);
        const success = gl.getProgramParameter(program, gl.LINK_STATUS);
        if (success) {
            return program;
        }
        console.log(gl.getProgramInfoLog(program));
        gl.deleteProgram(program);
    }

    const vertexShaderSource = `#version 300 es
in vec4 a_position;

void main() {
  gl_Position = a_position;
}
`;

    const fragmentShaderSource = textarea.value;

    const vertexShader = createShader(gl, gl.VERTEX_SHADER, vertexShaderSource);
    const fragmentShader = createShader(gl, gl.FRAGMENT_SHADER, fragmentShaderSource);
    if (vertexShader === undefined) {
        error("vertex shader compilation failed");
    }
    if (fragmentShader === undefined) {
        error("fragment shader compilation failed");
    }

    let program = createProgram(gl, vertexShader, fragmentShader);
    if (program === undefined) {
        error("program creation failed");
    }

    let timeLocation = gl.getUniformLocation(program, "u_time");
    let positionAttributeLocation = gl.getAttribLocation(program, "a_position");

    const positionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1.0, -1.0, -1.0, 1.0, 1.0, 0]), gl.STATIC_DRAW);

    const vao = gl.createVertexArray();
    gl.bindVertexArray(vao);
    gl.enableVertexAttribArray(positionAttributeLocation);
    gl.vertexAttribPointer(positionAttributeLocation, 2, gl.FLOAT, false, 0, 0);

    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);

    gl.useProgram(program);

    function renderLoop(timeStamp: number) {
        gl!.uniform1f(timeLocation, timeStamp / 1000.0);
        gl!.clearColor(0, 0, 0, 0);
        gl!.clear(gl!.COLOR_BUFFER_BIT);
        gl!.drawArrays(gl!.TRIANGLES, 0, 3);
        window.requestAnimationFrame(renderLoop);
    }

    var delayTimer: number;
    textarea.addEventListener('input', () => {
        clearTimeout(delayTimer);
        delayTimer = setTimeout(() => {
            const fragmentShaderSource = textarea.value;
            const fragmentShader = createShader(gl, gl.FRAGMENT_SHADER, fragmentShaderSource);
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

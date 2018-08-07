const canvas = document.querySelector("canvas");
const gl = canvas.getContext("webgl");

if(!gl)
	throw new TypeError('gl initialization');

function check() {
	var e = gl.getError();
	if(e)
		console.log('gl error' + e);
}
	
function compile(id, type) {
	if(type !== 'FRAGMENT' && type !== 'VERTEX')
		throw new TypeError('invalid type ' + type);
	
	var sh = gl.createShader(gl[type + '_SHADER']);
	var src = document.getElementById(id).textContent;
	
	gl.shaderSource(sh, src);
	gl.compileShader(sh);
	
	if(!gl.getShaderParameter(sh, gl.COMPILE_STATUS))
		throw new Error('compile error ' + id + ': ' + gl.getShaderInfoLog(sh));
	
	return sh;
}

function link(v, f) {
	var prog = gl.createProgram();
	var vert = compile(v, 'VERTEX');
	var frag = compile(f, 'FRAGMENT');
	gl.attachShader(prog, vert);
	gl.attachShader(prog, frag);
	gl.linkProgram(prog);
	
	if(!gl.getProgramParameter(prog, gl.LINK_STATUS))
		throw new Error('link error ' + gl.getProgramInfoLog(prog));
		
	return prog;
}

const buf = gl.createBuffer();
const tex = gl.createTexture(), tex_ = gl.createTexture();
var fbo = gl.createFramebuffer(), fbo_ = gl.createFramebuffer();
const texShader = link('vert', 'frag');
const currentShader = link('vert', 'add');
var _ = false;
var color = { r: 1.0, g: 1.0, b: 1.0 };

canvas.onmousemove = function(e) {
	var x = e.offsetX / canvas.offsetWidth;
	var y = 1.0 - e.offsetY / canvas.offsetHeight;
	
	gl.useProgram(currentShader);
	gl.uniform2f(gl.getUniformLocation(currentShader, 'mouse'), x, y);
	gl.uniform4f(gl.getUniformLocation(currentShader, 'color'), color.r, color.g, color.b, 1.0);
	
	_ = !_;
	if(_) {
		gl.bindFramebuffer(gl.FRAMEBUFFER, fbo_);
		gl.activeTexture(gl.TEXTURE0);
		gl.bindTexture(gl.TEXTURE_2D, tex);
	}
	else {
		gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
		gl.activeTexture(gl.TEXTURE0);
		gl.bindTexture(gl.TEXTURE_2D, tex_);
	}
	
	gl.enableVertexAttribArray(0);
	gl.drawArrays(gl.TRIANGLES, 0, 6);
	
	if(_)
		gl.bindTexture(gl.TEXTURE_2D, tex_);
	else
		gl.bindTexture(gl.TEXTURE_2D, tex);
	
	
	gl.useProgram(texShader);
	gl.bindFramebuffer(gl.FRAMEBUFFER, null);
	gl.drawArrays(gl.TRIANGLES, 0, 6);
	gl.disableVertexAttribArray(0);
	gl.useProgram(null);
	gl.bindTexture(gl.TEXTURE_2D, null);
}

gl.useProgram(currentShader);
gl.uniform1i(gl.getUniformLocation(currentShader, 't'), 0);
gl.bindAttribLocation(currentShader, 0, 'p');
gl.useProgram(texShader);
gl.uniform1i(gl.getUniformLocation(texShader, 't'), 0);
gl.bindAttribLocation(texShader, 0, 'p');
gl.useProgram(null);
check();

gl.clearColor(0, 0, 0, 1);
gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
gl.bindBuffer(gl.ARRAY_BUFFER, buf);
gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([1, -1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1]), gl.STATIC_DRAW);
gl.bindBuffer(gl.ARRAY_BUFFER, null);
check();

var w = canvas.width, h = canvas.height;
gl.bindTexture(gl.TEXTURE_2D, tex);
gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, w, h, 0, gl.RGBA, gl.UNSIGNED_BYTE, new Uint8Array(w*h*4));
gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
check();

gl.bindTexture(gl.TEXTURE_2D, tex_);
gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, w, h, 0, gl.RGBA, gl.UNSIGNED_BYTE, new Uint8Array(w*h*4));
gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
gl.bindTexture(gl.TEXTURE_2D, null);
check();   

gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, tex, 0);
gl.bindFramebuffer(gl.FRAMEBUFFER, fbo_);
gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, tex_, 0);
gl.bindFramebuffer(gl.FRAMEBUFFER, null);

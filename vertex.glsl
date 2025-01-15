attribute vec3 aPosition;
attribute vec2 aTexCoord;
attribute vec3 aNormal;

uniform mat4 uModelViewMatrix;
uniform mat4 uProjectionMatrix;
uniform float uTime;

varying vec2 vTexCoord;
varying vec3 vNormal;
varying float vDepth;

void main() {
  // Add some movement based on time
  vec3 pos = aPosition;
  pos.x += sin(uTime * 0.001 + pos.y * 0.1) * 10.0;
  pos.y += cos(uTime * 0.001 + pos.x * 0.1) * 10.0;
  
  // Calculate position
  vec4 viewPosition = uModelViewMatrix * vec4(pos, 1.0);
  gl_Position = uProjectionMatrix * viewPosition;
  
  // Pass varyings to fragment shader
  vTexCoord = aTexCoord;
  vNormal = (uModelViewMatrix * vec4(aNormal, 0.0)).xyz;
  vDepth = -viewPosition.z;
} 
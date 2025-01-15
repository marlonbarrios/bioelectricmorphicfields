precision mediump float;

varying vec2 vTexCoord;
varying vec3 vNormal;
varying float vDepth;

uniform sampler2D uTexture;
uniform float uTime;

void main() {
  vec4 tex = texture2D(uTexture, vTexCoord);
  
  // Add some lighting
  vec3 light = normalize(vec3(1.0, 1.0, 1.0));
  float diff = max(dot(vNormal, light), 0.0);
  
  // Add depth-based fog
  float fogFactor = smoothstep(500.0, 1000.0, vDepth);
  vec3 fogColor = vec3(0.0, 0.0, 0.0);
  
  // Final color
  vec3 color = mix(tex.rgb * (0.5 + 0.5 * diff), fogColor, fogFactor);
  gl_FragColor = vec4(color, tex.a);
} 
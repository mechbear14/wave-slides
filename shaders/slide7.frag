uniform float u_time;
uniform vec2 u_resolution;
uniform int degree;

float function(float x) {
    float y = 0.0;
    for(int i = 0; i < 5; i ++ ) {
        y += (1.0 - step(degree + 0.5, float(i))) * 1.0 / float(i * 2 + 1) * sin(2.0 * float(i * 2 + 1) * x);
    }
    // float y = sin(2.0 * x) + 1.0 / 3.0 * sin(6.0 * x) + 1.0 / 5.0 * sin(10.0 * x) + 1.0 / 7.0 * sin(14.0 * x);
    return y;
}

float derivative(float x) {
    float dydx = 0.0;
    for(int i = 0; i < 5; i ++ ) {
        dydx += (1.0 - step(degree + 0.5, float(i))) * 2.0 * cos(2.0 * float(i * 2 + 1) * x);
    }
    // float dydx = 2.0 * cos(2.0 * x) + 2.0 * cos(6.0 * x) + 2.0 * cos(10.0 * x) + 2.0 * cos(14.0 * x);
    return dydx;
}

float functionMask(float thickness, float blurRadius, vec2 st) {
    float y = function(st.x);
    vec2 target = vec2(st.x, y);
    float dydx = derivative(st.x);
    float angle = atan(dydx);
    vec2 normal = vec2(-sin(angle), cos(angle));
    float thicknessBy2 = thickness / 2.0;
    float distanceToWave = dot(st - target, normal);
    return smoothstep(-blurRadius - thicknessBy2, - thicknessBy2, distanceToWave) -
    smoothstep(thicknessBy2, blurRadius + thicknessBy2, distanceToWave);
}

float lineMask(vec2 start, vec2 end, float thickness, float blurRadius, vec2 st) {
    float lengthOfLine = length(end - start);
    vec2 tangentUnit = (end - start) / lengthOfLine;
    vec2 normalUnit = vec2(-tangentUnit.y, tangentUnit.x);
    float tangentLength = dot(st - start, tangentUnit);
    float normalLength = dot(st - start, normalUnit);
    float thicknessBy2 = thickness / 2.0;
    float tangentMask = smoothstep(-blurRadius, 0.0, tangentLength) -
    smoothstep(lengthOfLine, lengthOfLine + blurRadius, tangentLength);
    float normalMask = smoothstep(-thicknessBy2 - blurRadius, - thicknessBy2, normalLength) -
    smoothstep(thicknessBy2, thicknessBy2 + blurRadius, normalLength);
    return tangentMask * normalMask;
}

void main() {
    vec2 st = gl_FragCoord.xy / u_resolution.xy * 2.0 - vec2(1.0, 1.0);
    float aspectRatio = u_resolution.x / u_resolution.y;
    float r = step(1.0, aspectRatio);
    st.x = st.x * mix(1.0, aspectRatio, r) * 1.5;
    st.y = st.y / mix(aspectRatio, 1.0, r) * 1.5;
    vec3 colour = vec3(0.0, 0.0, 0.0);
    
    vec3 light = vec3(0.0, 0.5, 0.0);
    vec3 glow = vec3(1.0, 1.0, 1.0);
    
    float xAxisLight = lineMask(vec2(-10.0, 0.0), vec2(10.0, 0.0), 0.005, 0.01, st);
    float yAxisLight = lineMask(vec2(0.0, - 10.0), vec2(0.0, 10.0), 0.005, 0.01, st);
    float signalLight = functionMask(0.05, 0.05, vec2(st.x + u_time * 0.5, st.y));
    float signalGlow = functionMask(0.05, 0.0, vec2(st.x + u_time * 0.5, st.y));
    
    colour = mix(colour, light, xAxisLight);
    colour = mix(colour, light, yAxisLight);
    colour = mix(colour, light, signalLight);
    colour = mix(colour, glow, signalGlow);
    gl_FragColor = vec4(colour, 1.0);
}
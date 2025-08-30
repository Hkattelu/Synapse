#version 330 core

// Vertex shader for a simple textured quad
layout (location = 0) in vec3 aPos;
layout (location = 1) in vec2 aTexCoord;

out vec2 TexCoord;

uniform mat4 model;
uniform mat4 view;
uniform mat4 projection;

void main()
{
    gl_Position = projection * view * model * vec4(aPos, 1.0);
    TexCoord = aTexCoord;
}

// Fragment shader
#version 330 core

in vec2 TexCoord;
out vec4 FragColor;

uniform sampler2D ourTexture;
uniform float time;

void main()
{
    vec2 uv = TexCoord;
    
    // Add some animation based on time
    uv.x += sin(time * 2.0) * 0.1;
    uv.y += cos(time * 1.5) * 0.1;
    
    vec4 texColor = texture(ourTexture, uv);
    
    // Apply some color effects
    texColor.rgb *= 1.0 + sin(time) * 0.2;
    
    FragColor = texColor;
}
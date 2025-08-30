# Language Support

Synapse Studio supports syntax highlighting for a wide variety of programming languages through Prism.js integration.

## Supported Languages

### Web Technologies
- **JavaScript** - Modern JavaScript with ES6+ features
- **TypeScript** - TypeScript with type annotations
- **JSX** - React JSX components
- **TSX** - TypeScript JSX components
- **HTML** - HTML markup with attributes
- **CSS** - CSS styles with modern features
- **JSON** - JSON data format

### Programming Languages
- **Python** - Python 3.x syntax
- **Java** - Java programming language
- **C++** - C++ with modern standards
- **Go** - Go programming language
- **Rust** - Rust systems programming language
- **SQL** - SQL database queries

### Markup & Configuration
- **Markdown** - Markdown documentation
- **YAML** - YAML configuration files
- **XML** - XML markup language

### Shell & Scripting
- **Bash** - Bash shell scripts

### Game Development
- **GLSL** - OpenGL Shading Language for graphics programming
- **GDScript** - Godot's built-in scripting language

## GLSL Support

GLSL (OpenGL Shading Language) is now fully supported with syntax highlighting for:

- Vertex shaders
- Fragment shaders
- Geometry shaders
- Compute shaders

### GLSL Features Highlighted:
- **Keywords**: `attribute`, `uniform`, `varying`, `in`, `out`, `void`, `main`
- **Types**: `vec2`, `vec3`, `vec4`, `mat4`, `sampler2D`, `float`, `int`, `bool`
- **Built-in Functions**: `texture2D`, `sin`, `cos`, `normalize`, `dot`, `cross`
- **Built-in Variables**: `gl_Position`, `gl_FragColor`, `gl_Vertex`
- **Preprocessor Directives**: `#version`, `#define`, `#ifdef`

### Example GLSL Code:
```glsl
#version 330 core

layout (location = 0) in vec3 aPos;
uniform mat4 transform;

void main()
{
    gl_Position = transform * vec4(aPos, 1.0);
}
```

## GDScript Support

GDScript is Godot's Python-like scripting language, now with full syntax highlighting support.

### GDScript Features Highlighted:
- **Keywords**: `extends`, `class_name`, `func`, `var`, `const`, `signal`, `enum`
- **Decorators**: `@export`, `@onready`, `@tool`
- **Built-in Types**: `Vector2`, `Vector3`, `Color`, `Node`, `Resource`
- **Control Flow**: `if`, `elif`, `else`, `for`, `while`, `match`, `when`
- **Built-in Functions**: `print`, `range`, `len`, `str`, `int`, `float`
- **Node Methods**: `get_node`, `find_child`, `queue_free`, `connect`

### Example GDScript Code:
```gdscript
extends CharacterBody2D

@export var speed: float = 100.0
@onready var sprite: Sprite2D = $Sprite2D

func _ready():
    print("Player ready!")

func _physics_process(delta):
    if Input.is_action_pressed("ui_right"):
        position.x += speed * delta
```

## Using Languages in Synapse Studio

1. **Create a Code Clip**: Add a code timeline item to your project
2. **Select Language**: In the Inspector panel, choose your desired language from the dropdown
3. **Paste Code**: Add your code content to the text area
4. **Automatic Highlighting**: Syntax highlighting will be applied automatically

## Language Detection

- Languages are detected based on your selection in the Inspector
- If an unknown language is selected, JavaScript highlighting is used as fallback
- All languages support the same animation features (typing, line-by-line, diff mode)

## Adding New Languages

To add support for additional languages:

1. Add the language to the Prism.js configuration in `vite.config.ts`
2. Update the language options in `src/components/Inspector.tsx`
3. Add test cases in `src/components/__tests__/CodeSequence.languages.test.tsx`

## Performance Notes

- Language highlighting is performed client-side using Prism.js
- Large code files may impact rendering performance
- Consider breaking very large code examples into smaller clips for better performance
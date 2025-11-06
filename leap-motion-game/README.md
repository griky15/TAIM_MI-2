# Leap Motion - Instrumento Musical Gestual

Instrumento musical interativo controlado por gestos das mãos usando Leap Motion.

## 📋 Requisitos

- **Leap Motion Controller** (hardware)
- **Leap Motion SDK** instalado no sistema
- Browser moderno com suporte a Web Audio API
- Servidor web local para executar (devido a CORS)

## 🚀 Como Executar

1. Certifique-se de que o Leap Motion está conectado e o software está a correr
2. Abra um servidor web local na pasta do projeto:
   
   **Opção 1 - Python:**
   ```bash
   python -m http.server 8000
   ```
   
   **Opção 2 - Node.js (http-server):**
   ```bash
   npx http-server -p 8000
   ```
   
   **Opção 3 - PHP:**
   ```bash
   php -S localhost:8000
   ```

3. Abra o browser em: `http://localhost:8000`

## 🎮 Como Usar

### Controlos Gestuais:

- **Eixo X (Horizontal)**: Move as mãos da esquerda para a direita para mudar a nota musical
- **Eixo Y (Vertical)**: Altura da mão controla a subdivisão rítmica (velocidade das notas)
- **Eixo Z (Profundidade)**: Aproximar/afastar a mão do sensor controla o volume
- **Duas Mãos**: Use ambas as mãos para tocar duas notas simultaneamente (harmonia)

### Controlos da Interface:

- **Escala Musical**: Escolha entre Maior, Menor, Pentatónica, Blues ou Cromática
- **Forma de Onda**: Altera o timbre do som (Sine, Triangle, Sawtooth, Square)
- **BPM**: Controla o tempo base das notas
- **Botão "i"**: Mostra/esconde as instruções

## 📁 Estrutura de Ficheiros

```
leap-motion-game/
├── index.html           # Estrutura HTML principal
├── styles.css           # Estilos e layout
├── audio-engine.js      # Motor de áudio (Web Audio API)
├── leap-controller.js   # Interface com Leap Motion
├── app.js              # Lógica principal da aplicação
└── README.md           # Este ficheiro
```

## 🎵 Escalas Musicais Disponíveis

- **Dó Maior**: Escala natural, alegre
- **Dó Menor**: Escala melancólica
- **Pentatónica**: 5 notas, estilo oriental
- **Blues**: Escala blues tradicional
- **Cromática**: Todas as 12 notas (semitons)

## 🔧 Tecnologias Utilizadas

- **HTML5 Canvas**: Visualização das mãos
- **Web Audio API**: Síntese de áudio em tempo real
- **Leap Motion JavaScript SDK**: Captura de dados gestuais
- **CSS3**: Interface responsiva e moderna

## 📝 Notas de Desenvolvimento

### Para adicionar novas funcionalidades:

1. **Gravação**: Implementar sistema de gravação em `recordButton` (app.js)
2. **Efeitos**: Adicionar reverb, delay, etc. no `audio-engine.js`
3. **Gestos**: Usar `grabStrength` e `pinchStrength` para controlos adicionais
4. **Visualização**: Expandir canvas para mostrar trail de movimento

### Debug:

- Abra a consola do browser (F12) para ver logs de conexão
- Verifique se o Leap Motion está a correr (ícone na barra de sistema)
- Certifique-se de que está sobre o sensor (mãos visíveis)

## 🐛 Troubleshooting

**Leap Motion não conecta:**
- Verifique se o daemon/serviço está a correr
- Reinicie o software do Leap Motion
- Verifique a ligação USB

**Sem áudio:**
- Clique em "Iniciar Áudio" primeiro
- Verifique permissões do browser para áudio
- Teste com fones/colunas

**Detecção de mãos inconsistente:**
- Posicione as mãos 20-30cm acima do sensor
- Evite luz solar direta
- Certifique-se de que as mãos estão abertas e visíveis

## 📄 Licença

Projeto académico - TAIM (Tecnologias e Aplicações para Interação Multimodal)

## 👥 Autores

Desenvolvido como parte do projeto MI-2

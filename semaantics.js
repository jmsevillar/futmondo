const fs = require('fs');

try {
    // 1. Leer el archivo JSON crudo que capturó Playwright
    if (!fs.existsSync('clasificacion_futmondo.json')) {
        throw new Error('No se encuentra el archivo "clasificacion_futmondo.json". Ejecuta primero el script de automatización.');
    }
    const rawData = fs.readFileSync('clasificacion_futmondo.json', 'utf-8');
    const json = JSON.parse(rawData);

    // 2. Extraer el array de equipos defendiendo la estructura de la API
    const equipos = Array.isArray(json) ? json : (json.teams || json.answer?.teams || json.answer || []);

    if (equipos.length === 0) {
        throw new Error('No se reconoció la lista de equipos en el JSON crudo.');
    }

    // 3. Mapear y limpiar la información que nos interesa
    const clasificacionLimpia = equipos.map((eq, index) => {
        return {
            posicion: index + 1,
            nombreEquipo: eq.name || eq.team_name || 'Desconocido',
            usuario: eq.user?.name || eq.username || 'Sin usuario',
            puntos: eq.points || eq.total_points || 0,
            valorEquipo: eq.teamValue || eq.value || 0
        };
    });

    // 4. Obtener de manera dinámica el "usuario usado"
    // Buscamos tu usuario dentro de los datos del JSON (o puedes poner 't_sevi' a piñón fijo)
    let usuarioUsado = 't_sevi'; 
    const primerEquipoConUsuario = equipos.find(eq => eq.user?.name || eq.username);
    if (primerEquipoConUsuario) {
        const nombreEncontrado = primerEquipoConUsuario.user?.name || primerEquipoConUsuario.username;
        // Limpiamos arrobas o caracteres raros por seguridad para el nombre del archivo
        usuarioUsado = nombreEncontrado.split('@')[0].replace(/[^a-zA-Z0-9__-]/g, '');
    }

    // 5. Formatear la fecha para el nombre del archivo (YYYY-MM-DD)
    const hoy = new Date();
    const año = hoy.getFullYear();
    const mes = String(hoy.getMonth() + 1).padStart(2, '0');
    const dia = String(hoy.getDate()).padStart(2, '0');
    const fechaFormateada = `${año}-${mes}-${dia}`;

    // 6. Definir el nombre del archivo dinámico
    const nombreArchivoFinal = `clasificacion_${usuarioUsado}_${fechaFormateada}.json`;

    // 7. Estructurar el JSON que se guardará de forma definitiva
    const registroEstructurado = {
        usuario_sesion: usuarioUsado,
        fecha_captura: hoy.toISOString(),
        datos: clasificacionLimpia
    };

    // 8. Guardar el archivo final independiente
    fs.writeFileSync(nombreArchivoFinal, JSON.stringify(registroEstructurado, null, 2), 'utf-8');
    console.log(`\n[ÉXITO] Archivo generado: "${nombreArchivoFinal}"`);
    console.log(`        Contiene ${clasificacionLimpia.length} equipos de tu comunidad.`);

} catch (error) {
    console.error('\n[ERROR PROCESANDO HISTÓRICO]');
    console.error(error.message);
}

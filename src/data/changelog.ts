export interface ChangelogEntry {
  date: string;
  notes: string[];
}

// Agregá una entrada nueva (al principio del array) cada vez que despliegues un
// cambio visible para el usuario. El cartel de "Nueva actualización disponible"
// siempre muestra las notas de la primera entrada de esta lista.
export const CHANGELOG: ChangelogEntry[] = [
  {
    date: '11 de septiembre, 2026',
    notes: [
      'Hábitos: ahora también tienen papelera — eliminar uno lo manda ahí por 30 días antes de borrarse para siempre.',
      'Registrarse ahora pide confirmar la contraseña, para evitar errores de tipeo.',
      'Corregido: eliminar una tarea archivada la borraba para siempre en vez de mandarla a la papelera.',
      'Ajustes y Admin ahora muestran su nombre en el menú en el celular.',
      'Varios ajustes de contraste y accesibilidad en los tres temas.',
    ],
  },
  {
    date: '9 de septiembre, 2026',
    notes: [
      'Notas: activá en Ajustes que las notas-enlace abran el sitio directo al hacer clic.',
      'Tema Rosado: corregidos varios detalles de color que se veían morados.',
      'El aviso de actualización de la app ahora es más confiable.',
    ],
  },
];

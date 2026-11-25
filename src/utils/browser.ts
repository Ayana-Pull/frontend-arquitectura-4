/**
 * Por HTTP fuera de localhost (p. ej. http://<ip>:9002 en la red local) el navegador no es un
 * «contexto seguro»: no existen `crypto.randomUUID` ni `navigator.clipboard`. Estas versiones
 * usan la API moderna cuando está y una alternativa cuando no.
 */

let counter = 0

/** Identificador único dentro de la página; solo sirve como clave local, no como secreto. */
export function uniqueId() {
  // Algunos navegadores exponen la propiedad pero fallan al llamarla fuera de un contexto seguro.
  if (globalThis.isSecureContext && typeof globalThis.crypto?.randomUUID === 'function') {
    try {
      return globalThis.crypto.randomUUID()
    }
    catch {
      // Se usa la alternativa de abajo.
    }
  }
  counter += 1
  return `${Date.now().toString(36)}-${counter.toString(36)}-${Math.random().toString(36).slice(2, 10)}`
}

/** Copia texto al portapapeles; devuelve si lo consiguió. */
export async function copyText(text: string) {
  if (navigator.clipboard && window.isSecureContext) {
    try {
      await navigator.clipboard.writeText(text)
      return true
    }
    catch {
      // Sin permiso del navegador: se prueba la alternativa.
    }
  }
  const field = document.createElement('textarea')
  field.value = text
  field.setAttribute('readonly', '')
  field.style.position = 'fixed'
  field.style.opacity = '0'
  document.body.append(field)
  field.select()
  try {
    return document.execCommand('copy')
  }
  catch {
    return false
  }
  finally {
    field.remove()
  }
}

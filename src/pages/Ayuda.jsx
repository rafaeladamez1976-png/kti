import React from 'react';
import { HelpCircle, Map, BarChart3, Search, FileText, Bell, Settings, LayoutDashboard, ChevronRight } from 'lucide-react';
import PageHeader from '@/components/ui/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';

export default function Ayuda({ user }) {
  const modules = [
    {
      icon: LayoutDashboard,
      title: 'Dashboard',
      description: 'Centro de control principal con indicadores clave y mapa interactivo.',
      details: [
        'Visualización de alertas activas',
        'Conteo de riesgos altos',
        'Territorios bajo monitoreo',
        'Mapa con todos los hallazgos',
        'Acceso rápido a últimas alertas y hallazgos'
      ]
    },
    {
      icon: Map,
      title: 'Territorios',
      description: 'Gestión de áreas geográficas bajo monitoreo satelital.',
      details: [
        'Crear territorios dibujando en el mapa',
        'Cargar áreas desde archivos KML o GeoJSON',
        'Configurar frecuencia de monitoreo (semanal, quincenal, mensual)',
        'Activar o pausar el monitoreo',
        'Ejecutar análisis manuales',
        'Eliminar territorios'
      ]
    },
    {
      icon: BarChart3,
      title: 'Análisis',
      description: 'Ejecución y gestión de análisis de cambios en imágenes satelitales.',
      details: [
        'Ejecutar análisis manual seleccionando fechas',
        'Comparación de imágenes Sentinel-1 y Sentinel-2',
        'Detección automática de cambios',
        'Clasificación de hallazgos por nivel de riesgo',
        'Generación automática de alertas para riesgos altos'
      ]
    },
    {
      icon: Search,
      title: 'Hallazgos',
      description: 'Revisión y gestión de cambios detectados en los territorios.',
      details: [
        'Comparador de imágenes antes/después con slider',
        'Edición de clasificación y nivel de riesgo',
        'Visualización de coordenadas exactas',
        'Marcar como revisado',
        'Añadir a informes',
        'Filtros por territorio, riesgo y estado'
      ]
    },
    {
      icon: FileText,
      title: 'Informes',
      description: 'Generación de informes de monitoreo.',
      details: [
        'Crear informes seleccionando hallazgos',
        'Editar resumen y recomendaciones',
        'Vista previa tipo PDF',
        'Estados: borrador, generado, enviado',
        'Incluye mapa general y tabla de coordenadas'
      ]
    },
    {
      icon: Bell,
      title: 'Alertas',
      description: 'Sistema de notificaciones para cambios de alto riesgo.',
      details: [
        'Alertas automáticas para riesgos altos',
        'Estados: activa, resuelta, descartada',
        'Registro de notas de resolución',
        'Historial completo de alertas'
      ]
    },
    {
      icon: Settings,
      title: 'Configuración',
      description: 'Gestión de usuarios y ajustes del sistema (solo administradores).',
      details: [
        'Editar usuarios existentes',
        'Cambiar roles (administrador/operador)',
        'Activar o desactivar usuarios',
        'Eliminar usuarios'
      ]
    }
  ];

  const faq = [
    {
      question: '¿Cómo creo un nuevo territorio?',
      answer: 'Vaya a la sección Territorios y haga clic en "Crear territorio". Puede dibujar el área directamente en el mapa haciendo clic para agregar puntos, o cargar un archivo KML o GeoJSON. Seleccione la frecuencia de monitoreo y guarde.'
    },
    {
      question: '¿Cómo ejecuto un análisis manual?',
      answer: 'Desde la sección Análisis, haga clic en "Nuevo análisis". Seleccione el territorio, las fechas de las imágenes "Antes" y "Después", y ejecute el análisis. El sistema comparará las imágenes y generará hallazgos automáticamente.'
    },
    {
      question: '¿Qué significan los niveles de riesgo?',
      answer: 'Alto (rojo): Cambios significativos que requieren atención inmediata. Medio (amarillo): Cambios moderados que deben ser monitoreados. Bajo (verde): Cambios menores o variaciones normales.'
    },
    {
      question: '¿Cómo genero un informe?',
      answer: 'Primero, marque los hallazgos que desea incluir desde la sección Hallazgos usando "Añadir al informe". Luego, vaya a Informes, cree uno nuevo y seleccione los hallazgos marcados. Complete el resumen y recomendaciones.'
    },
    {
      question: '¿Quién puede gestionar usuarios?',
      answer: 'Solo los usuarios con rol de Administrador pueden acceder a la configuración de usuarios. Los operadores tienen acceso de solo lectura a los demás módulos pero no pueden gestionar usuarios.'
    },
    {
      question: '¿Cómo resuelvo una alerta?',
      answer: 'En la sección Alertas, busque la alerta activa y seleccione "Marcar resuelta" en el menú. Puede agregar notas sobre las acciones tomadas. También puede descartar alertas si no requieren acción.'
    }
  ];

  return (
    <div className="space-y-6">
      <PageHeader 
        title="Ayuda"
        description="Guía de uso del sistema KTI"
      />

      {/* System Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <HelpCircle size={20} />
            ¿Qué es KTI?
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-slate-600">
            KTI es un sistema de monitoreo territorial mediante imágenes satelitales. 
            Permite detectar cambios en áreas de interés comparando imágenes de diferentes fechas, 
            clasificar los hallazgos por nivel de riesgo y generar informes detallados para la toma de decisiones.
          </p>
        </CardContent>
      </Card>

      {/* Modules */}
      <Card>
        <CardHeader>
          <CardTitle>Módulos del sistema</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {modules.map((module) => (
              <div key={module.title} className="border rounded-lg p-4">
                <div className="flex items-start gap-3 mb-3">
                  <div className="p-2 bg-emerald-100 rounded-lg">
                    <module.icon className="text-emerald-600" size={20} />
                  </div>
                  <div>
                    <h3 className="font-semibold">{module.title}</h3>
                    <p className="text-sm text-slate-500">{module.description}</p>
                  </div>
                </div>
                <ul className="space-y-1 ml-11">
                  {module.details.map((detail, i) => (
                    <li key={i} className="flex items-center gap-2 text-sm text-slate-600">
                      <ChevronRight size={14} className="text-slate-400" />
                      {detail}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* FAQ */}
      <Card>
        <CardHeader>
          <CardTitle>Preguntas frecuentes</CardTitle>
        </CardHeader>
        <CardContent>
          <Accordion type="single" collapsible className="w-full">
            {faq.map((item, index) => (
              <AccordionItem key={index} value={`item-${index}`}>
                <AccordionTrigger className="text-left">
                  {item.question}
                </AccordionTrigger>
                <AccordionContent className="text-slate-600">
                  {item.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </CardContent>
      </Card>

      {/* Roles */}
      <Card>
        <CardHeader>
          <CardTitle>Roles de usuario</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="border rounded-lg p-4">
              <h3 className="font-semibold text-emerald-700 mb-2">Administrador</h3>
              <ul className="space-y-1 text-sm text-slate-600">
                <li>• Acceso completo a todos los módulos</li>
                <li>• Gestión de usuarios (crear, editar, eliminar)</li>
                <li>• Activar/desactivar cuentas de usuario</li>
                <li>• Cambiar roles de usuarios</li>
                <li>• Configuración del sistema</li>
              </ul>
            </div>
            <div className="border rounded-lg p-4">
              <h3 className="font-semibold text-slate-700 mb-2">Operador</h3>
              <ul className="space-y-1 text-sm text-slate-600">
                <li>• Acceso a Dashboard, Territorios, Análisis</li>
                <li>• Gestión de Hallazgos e Informes</li>
                <li>• Gestión de Alertas</li>
                <li>• Sin acceso a gestión de usuarios</li>
                <li>• Sin acceso a configuración del sistema</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
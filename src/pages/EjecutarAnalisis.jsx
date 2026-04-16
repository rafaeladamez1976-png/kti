import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { createPageUrl } from '@/utils';
import { ArrowLeft, BarChart3, Calendar, Map, Loader2, CheckCircle, AlertTriangle } from 'lucide-react';
import PageHeader from '@/components/ui/PageHeader';
import EmptyState from '@/components/ui/EmptyState';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

export default function EjecutarAnalisis({ user }) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const urlParams = new URLSearchParams(window.location.search);
  const preselectedTerritorioId = urlParams.get('territorio_id');

  const [step, setStep] = useState(1);
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState(null);

  const [formData, setFormData] = useState({
    territorio_id: preselectedTerritorioId || '',
    fecha_imagen_a: '',
    fecha_imagen_b: '',
    tipo: 'manual'
  });

  const { data: territorios = [], isLoading: loadingTerritorios } = useQuery({
    queryKey: ['territorios'],
    queryFn: () => base44.entities.Territorio.list('-created_date', 100)
  });

  const selectedTerritorio = territorios.find(t => t.id === formData.territorio_id);

  const createAnalisisMutation = useMutation({
    mutationFn: async (data) => {
      // Create the analysis record
      const analisis = await base44.entities.Analisis.create({
        ...data,
        territorio_nombre: selectedTerritorio?.nombre,
        estado: 'procesando',
        ejecutado_por: user?.email
      });
      return analisis;
    },
    onSuccess: async (analisis) => {
      setProcessing(true);
      
      // Simulate processing steps
      const steps = [
        { progress: 20, message: 'Descargando imagen A...' },
        { progress: 40, message: 'Descargando imagen B...' },
        { progress: 60, message: 'Comparando imágenes...' },
        { progress: 80, message: 'Detectando cambios...' },
        { progress: 90, message: 'Clasificando hallazgos...' },
        { progress: 100, message: 'Completado' },
      ];

      for (const step of steps) {
        await new Promise(r => setTimeout(r, 1000));
        setProgress(step.progress);
      }

      // Generate mock results (in real app, this would come from AI/satellite processing)
      const numChanges = Math.floor(Math.random() * 5);
      
      // Update analysis with results
      await base44.entities.Analisis.update(analisis.id, {
        estado: 'completado',
        cambios_detectados: numChanges,
        resumen: numChanges > 0 
          ? `Se detectaron ${numChanges} cambios significativos en el área monitoreada.`
          : 'No se detectaron cambios significativos en el período analizado.'
      });

      // Update territorio last analysis date
      if (formData.territorio_id) {
        await base44.entities.Territorio.update(formData.territorio_id, {
          ultimo_analisis: formData.fecha_imagen_b
        });
      }

      // Create findings if changes detected
      if (numChanges > 0) {
        const tiposCambio = ['deforestacion', 'construccion', 'excavacion', 'invasion', 'infraestructura'];
        const niveles = ['bajo', 'medio', 'alto'];
        
        for (let i = 0; i < numChanges; i++) {
          const tipoCambio = tiposCambio[Math.floor(Math.random() * tiposCambio.length)];
          const nivel = niveles[Math.floor(Math.random() * niveles.length)];
          
          const hallazgo = await base44.entities.Hallazgo.create({
            analisis_id: analisis.id,
            territorio_id: formData.territorio_id,
            territorio_nombre: selectedTerritorio?.nombre,
            nombre: `Cambio detectado #${i + 1}`,
            tipo_cambio: tipoCambio,
            nivel_riesgo: nivel,
            descripcion_ia: `Cambio de tipo ${tipoCambio.replace(/_/g, ' ')} detectado mediante análisis de imágenes satelitales.`,
            latitud: (selectedTerritorio?.centro_lat || 4.6097) + (Math.random() - 0.5) * 0.1,
            longitud: (selectedTerritorio?.centro_lng || -74.0817) + (Math.random() - 0.5) * 0.1,
            fecha_deteccion: formData.fecha_imagen_b,
            revisado: false,
            incluido_en_informe: false
          });

          // Create alert for high risk findings
          if (nivel === 'alto') {
            await base44.entities.Alerta.create({
              hallazgo_id: hallazgo.id,
              territorio_id: formData.territorio_id,
              territorio_nombre: selectedTerritorio?.nombre,
              titulo: `Riesgo alto detectado: ${tipoCambio.replace(/_/g, ' ')}`,
              descripcion: `Se ha detectado un cambio de alto riesgo en el territorio ${selectedTerritorio?.nombre}.`,
              nivel: 'alto',
              estado: 'activa'
            });
          }
        }
      }

      setResult({
        success: true,
        analisisId: analisis.id,
        cambiosDetectados: numChanges
      });
      
      queryClient.invalidateQueries({ queryKey: ['analisis'] });
      queryClient.invalidateQueries({ queryKey: ['hallazgos'] });
      queryClient.invalidateQueries({ queryKey: ['alertas'] });
      queryClient.invalidateQueries({ queryKey: ['territorios'] });
      
      setProcessing(false);
    }
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!formData.territorio_id) {
      alert('Debe seleccionar un territorio');
      return;
    }
    if (!formData.fecha_imagen_a || !formData.fecha_imagen_b) {
      alert('Debe seleccionar ambas fechas');
      return;
    }
    if (new Date(formData.fecha_imagen_a) >= new Date(formData.fecha_imagen_b)) {
      alert('La fecha "Antes" debe ser anterior a la fecha "Después"');
      return;
    }

    setStep(2);
    createAnalisisMutation.mutate(formData);
  };

  if (loadingTerritorios) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-500" />
      </div>
    );
  }

  if (territorios.length === 0) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate(createPageUrl('Analisis'))}>
            <ArrowLeft size={20} />
          </Button>
          <PageHeader title="Ejecutar análisis" />
        </div>
        
        <EmptyState
          icon={Map}
          title="No hay territorios disponibles"
          description="Debe crear al menos un territorio antes de ejecutar un análisis"
          action={
            <Button onClick={() => navigate(createPageUrl('Territorios'))} className="bg-emerald-600 hover:bg-emerald-700">
              Crear territorio
            </Button>
          }
        />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate(createPageUrl('Analisis'))}>
          <ArrowLeft size={20} />
        </Button>
        <PageHeader 
          title="Ejecutar análisis manual"
          description="Compare imágenes satelitales para detectar cambios"
        />
      </div>

      {step === 1 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 size={20} />
              Configuración del análisis
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="territorio">Territorio *</Label>
                <Select 
                  value={formData.territorio_id} 
                  onValueChange={(value) => setFormData(prev => ({ ...prev, territorio_id: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccione un territorio" />
                  </SelectTrigger>
                  <SelectContent>
                    {territorios.map(t => (
                      <SelectItem key={t.id} value={t.id}>{t.nombre}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="fecha_a">Fecha imagen "Antes" *</Label>
                  <Input
                    id="fecha_a"
                    type="date"
                    value={formData.fecha_imagen_a}
                    onChange={(e) => setFormData(prev => ({ ...prev, fecha_imagen_a: e.target.value }))}
                    max={formData.fecha_imagen_b || undefined}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="fecha_b">Fecha imagen "Después" *</Label>
                  <Input
                    id="fecha_b"
                    type="date"
                    value={formData.fecha_imagen_b}
                    onChange={(e) => setFormData(prev => ({ ...prev, fecha_imagen_b: e.target.value }))}
                    min={formData.fecha_imagen_a || undefined}
                    max={new Date().toISOString().split('T')[0]}
                  />
                </div>
              </div>

              <Alert>
                <Calendar className="h-4 w-4" />
                <AlertTitle>Nota importante</AlertTitle>
                <AlertDescription>
                  El análisis comparará las imágenes satelitales disponibles más cercanas a las fechas seleccionadas.
                </AlertDescription>
              </Alert>

              <div className="flex justify-end gap-3 pt-4">
                <Button type="button" variant="outline" onClick={() => navigate(createPageUrl('Analisis'))}>
                  Cancelar
                </Button>
                <Button type="submit" className="bg-emerald-600 hover:bg-emerald-700">
                  Ejecutar análisis
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {step === 2 && (
        <Card>
          <CardContent className="py-12">
            {processing ? (
              <div className="text-center space-y-6">
                <Loader2 className="h-12 w-12 animate-spin text-emerald-500 mx-auto" />
                <div>
                  <h3 className="text-lg font-semibold">Procesando análisis...</h3>
                  <p className="text-slate-500">Esto puede tomar unos minutos</p>
                </div>
                <div className="max-w-md mx-auto">
                  <Progress value={progress} className="h-2" />
                  <p className="text-sm text-slate-400 mt-2">{progress}% completado</p>
                </div>
              </div>
            ) : result ? (
              <div className="text-center space-y-6">
                <CheckCircle className="h-16 w-16 text-emerald-500 mx-auto" />
                <div>
                  <h3 className="text-xl font-semibold text-emerald-600">Análisis completado</h3>
                  <p className="text-slate-500 mt-2">
                    {result.cambiosDetectados > 0 
                      ? `Se detectaron ${result.cambiosDetectados} cambios significativos`
                      : 'No se detectaron cambios significativos'
                    }
                  </p>
                </div>
                
                {result.cambiosDetectados > 0 && (
                  <Alert className="bg-amber-50 border-amber-200 text-left max-w-md mx-auto">
                    <AlertTriangle className="h-4 w-4 text-amber-600" />
                    <AlertTitle className="text-amber-800">Atención</AlertTitle>
                    <AlertDescription className="text-amber-700">
                      Se han creado {result.cambiosDetectados} hallazgos que requieren revisión manual.
                    </AlertDescription>
                  </Alert>
                )}

                <div className="flex justify-center gap-3 pt-4">
                  <Button variant="outline" onClick={() => navigate(createPageUrl('Analisis'))}>
                    Ver todos los análisis
                  </Button>
                  <Button 
                    className="bg-emerald-600 hover:bg-emerald-700"
                    onClick={() => navigate(createPageUrl('AnalisisDetalle') + `?id=${result.analisisId}`)}
                  >
                    Ver resultados
                  </Button>
                </div>
              </div>
            ) : null}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
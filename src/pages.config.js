import Dashboard from './pages/Dashboard';
import Territorios from './pages/Territorios';
import TerritorioDetalle from './pages/TerritorioDetalle';
import Analisis from './pages/Analisis';
import EjecutarAnalisis from './pages/EjecutarAnalisis';
import AnalisisDetalle from './pages/AnalisisDetalle';
import Hallazgos from './pages/Hallazgos';
import HallazgoDetalle from './pages/HallazgoDetalle';
import Informes from './pages/Informes';
import InformeDetalle from './pages/InformeDetalle';
import Alertas from './pages/Alertas';
import Configuracion from './pages/Configuracion';
import Ayuda from './pages/Ayuda';
import __Layout from './Layout.jsx';


export const PAGES = {
    "Dashboard": Dashboard,
    "Territorios": Territorios,
    "TerritorioDetalle": TerritorioDetalle,
    "Analisis": Analisis,
    "EjecutarAnalisis": EjecutarAnalisis,
    "AnalisisDetalle": AnalisisDetalle,
    "Hallazgos": Hallazgos,
    "HallazgoDetalle": HallazgoDetalle,
    "Informes": Informes,
    "InformeDetalle": InformeDetalle,
    "Alertas": Alertas,
    "Configuracion": Configuracion,
    "Ayuda": Ayuda,
}

export const pagesConfig = {
    mainPage: "Dashboard",
    Pages: PAGES,
    Layout: __Layout,
};
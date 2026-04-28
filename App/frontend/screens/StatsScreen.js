import React, { useState, useMemo, useContext, useCallback } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, Dimensions, RefreshControl,
} from 'react-native';
import { LineChart, BarChart } from 'react-native-chart-kit';
import { colors } from '../constants/colors';
import { useFonts } from '../hooks/useFonts';
import LoadingSpinner from '../components/LoadingSpinner';
import { AuthContext } from '../context/AuthContext';
import { getEstadisticas } from '../services/dataService';

const SCREEN_WIDTH = Dimensions.get('window').width;
const CHART_WIDTH = SCREEN_WIDTH - 48;

const AREA_COLORS = {
  Memoria: '#2E7D32',
  'Atención': '#1565C0',
  Lenguaje: '#E65100',
};

const AREA_EMOJIS = {
  Memoria: '🧠',
  'Atención': '👁️',
  Lenguaje: '📖',
};

const JUEGO_EMOJIS = {
  'La Receta de la Abuela': '🍲',
  'Jardín de la Memoria': '🌻',
  'El Mercado': '🛒',
  'El Semáforo': '🚦',
  'Cazamariposas': '🦋',
  'El Vigilante': '👁️',
  'Refranes Perdidos': '📜',
  'La Oveja Perdida': '🐑',
  'El Reloj de Letras': '🕰️',
};

const CHART_CONFIG_BASE = {
  backgroundGradientFrom: '#FFFFFF',
  backgroundGradientTo: '#FFFFFF',
  decimalCount: 0,
  color: (opacity = 1) => `rgba(27, 94, 32, ${opacity})`,
  labelColor: () => colors.lightText,
  propsForLabels: { fontSize: 12 },
  propsForDots: { r: '4', strokeWidth: '2', stroke: colors.primary },
};

/**
 * Formatea segundos a texto legible.
 * @param {number} s - Segundos totales.
 * @returns {string}
 */
function formatTiempo(s) {
  if (!s || s <= 0) return '0 seg';
  if (s < 60) return `${s} seg`;
  if (s < 3600) return `${Math.floor(s / 60)} min`;
  return `${Math.floor(s / 3600)}h ${Math.floor((s % 3600) / 60)}min`;
}

/**
 * Formatea una fecha ISO a "dd/MM".
 * @param {string} iso
 * @returns {string}
 */
function formatFechaCorta(iso) {
  const d = new Date(iso);
  return `${d.getDate()}/${d.getMonth() + 1}`;
}

/**
 * Calcula racha de días consecutivos (hacia atrás desde hoy).
 * @param {Array} fechas - Array de strings ISO.
 * @returns {number}
 */
function calcularRacha(fechas) {
  if (!fechas || fechas.length === 0) return 0;
  const dias = [...new Set(fechas.map((f) => new Date(f).toISOString().slice(0, 10)))].sort().reverse();
  const hoy = new Date().toISOString().slice(0, 10);
  if (dias[0] !== hoy) {
    const ayer = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
    if (dias[0] !== ayer) return 0;
  }
  let racha = 1;
  for (let i = 1; i < dias.length; i++) {
    const prev = new Date(dias[i - 1]);
    const curr = new Date(dias[i]);
    const diff = (prev - curr) / 86400000;
    if (diff === 1) racha++;
    else break;
  }
  return racha;
}

/**
 * Pantalla de estadísticas.
 * Muestra resumen global, comparación por áreas cognitivas,
 * y detalle por juego con gráficas de evolución.
 */
export default function StatsScreen() {
  const { user, isGuest } = useContext(AuthContext);
  const f = useFonts();
  const styles = useMemo(() => getStyles(f), [f]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [expandedGame, setExpandedGame] = useState(null);
  const [activeTab, setActiveTab] = useState('general');

  const cargarStats = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    setError(null);
    try {
      const data = await getEstadisticas();
      setStats(data);
    } catch (err) {
      if (err.response?.status === 404) {
        setStats([]);
      } else {
        setError('No se pudieron cargar las estadísticas');
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      if (user) cargarStats(stats !== null);
    }, [user])
  );

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    cargarStats(true);
  }, [cargarStats]);

  // ================= DATOS COMPUTADOS =================

  const todasFechas = useMemo(() => {
    if (!stats || !Array.isArray(stats)) return [];
    return stats.flatMap((j) => (j.resultados || []).map((r) => r.fecha));
  }, [stats]);

  const resumenGlobal = useMemo(() => {
    if (!stats || !Array.isArray(stats) || stats.length === 0) {
      return { partidas: 0, tiempo: 0, media: 0, racha: 0 };
    }
    let partidas = 0;
    let tiempo = 0;
    let sumPunt = 0;
    stats.forEach((j) => {
      (j.resultados || []).forEach((r) => {
        partidas++;
        tiempo += r.duracion_segundos || 0;
        sumPunt += r.puntuacion || 0;
      });
    });
    return {
      partidas,
      tiempo,
      media: partidas > 0 ? Math.round(sumPunt / partidas) : 0,
      racha: calcularRacha(todasFechas),
    };
  }, [stats, todasFechas]);

  const areaStats = useMemo(() => {
    if (!stats || !Array.isArray(stats) || stats.length === 0) return [];
    const map = {};
    stats.forEach((j) => {
      const area = j.area_cognitiva;
      if (!map[area]) map[area] = { area, partidas: 0, sumPunt: 0, tiempo: 0 };
      (j.resultados || []).forEach((r) => {
        map[area].partidas++;
        map[area].sumPunt += r.puntuacion || 0;
        map[area].tiempo += r.duracion_segundos || 0;
      });
    });
    return Object.values(map).map((a) => ({
      ...a,
      media: a.partidas > 0 ? Math.round(a.sumPunt / a.partidas) : 0,
    }));
  }, [stats]);

  const juegosPorArea = useMemo(() => {
    if (!stats || !Array.isArray(stats)) return {};
    const grouped = {};
    stats.forEach((j) => {
      const area = j.area_cognitiva;
      if (!grouped[area]) grouped[area] = [];
      const resultados = j.resultados || [];
      const puntuaciones = resultados.map((r) => r.puntuacion);
      const niveles = resultados.map((r) => r.nivel_dificultad);
      grouped[area].push({
        ...j,
        totalPartidas: resultados.length,
        media: resultados.length > 0 ? Math.round(puntuaciones.reduce((a, b) => a + b, 0) / resultados.length) : 0,
        maxPunt: puntuaciones.length > 0 ? Math.round(Math.max(...puntuaciones)) : 0,
        ultimaPunt: puntuaciones.length > 0 ? Math.round(puntuaciones[puntuaciones.length - 1]) : 0,
        nivelActual: niveles.length > 0 ? niveles[niveles.length - 1] : 0,
        tiempoTotal: resultados.reduce((s, r) => s + (r.duracion_segundos || 0), 0),
      });
    });
    return grouped;
  }, [stats]);

  const actividadSemanal = useMemo(() => {
    const dias = [];
    const labels = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(Date.now() - i * 86400000);
      const key = d.toISOString().slice(0, 10);
      dias.push(key);
      labels.push(['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'][d.getDay()]);
    }
    const conteo = dias.map((key) =>
      todasFechas.filter((f) => new Date(f).toISOString().slice(0, 10) === key).length
    );
    return { labels, data: conteo };
  }, [todasFechas]);

  // ================= GRÁFICA DE EVOLUCIÓN POR JUEGO =================

  const buildLineData = (resultados, field) => {
    if (!resultados || resultados.length === 0) return null;
    const sorted = [...resultados].sort((a, b) => new Date(a.fecha) - new Date(b.fecha));
    const maxPoints = 10;
    const sampled = sorted.length > maxPoints
      ? sorted.filter((_, i) => i === 0 || i === sorted.length - 1 || i % Math.ceil(sorted.length / maxPoints) === 0)
      : sorted;
    return {
      labels: sampled.map((r) => formatFechaCorta(r.fecha)),
      datasets: [{ data: sampled.map((r) => r[field] ?? 0) }],
    };
  };

  // ================= RENDER =================

  if (loading) return <LoadingSpinner />;

  const sinDatos = !stats || !Array.isArray(stats) || stats.length === 0;

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} />
      }
    >
      {/* CABECERA */}
      <View style={styles.header}>
        <Text style={styles.headerEmoji}>📊</Text>
        <Text style={styles.headerTitle} accessibilityRole="header">
          Estadísticas
        </Text>
      </View>

      {error ? (
        <View style={styles.errorCard} accessibilityRole="alert">
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity onPress={() => cargarStats()} style={styles.retryBtn} accessibilityRole="button">
            <Text style={styles.retryBtnText}>Reintentar</Text>
          </TouchableOpacity>
        </View>
      ) : sinDatos ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyEmoji}>🎮</Text>
          <Text style={styles.emptyTitle}>Sin datos todavía</Text>
          <Text style={styles.emptyText}>
            Juega algunas partidas para ver tu progreso aquí.
          </Text>
        </View>
      ) : (
        <>
          {/* TABS */}
          <View style={styles.tabRow}>
            {[
              { key: 'general', label: '📋 General' },
              { key: 'areas', label: '🧩 Áreas' },
              { key: 'juegos', label: '🎮 Juegos' },
            ].map((tab) => (
              <TouchableOpacity
                key={tab.key}
                style={[styles.tab, activeTab === tab.key && styles.tabActive]}
                onPress={() => setActiveTab(tab.key)}
                accessibilityRole="tab"
                accessibilityState={{ selected: activeTab === tab.key }}
              >
                <Text style={[styles.tabText, activeTab === tab.key && styles.tabTextActive]}>
                  {tab.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* ============ TAB GENERAL ============ */}
          {activeTab === 'general' && (
            <View style={styles.tabContent}>
              {/* Resumen */}
              <View style={styles.summaryGrid}>
                <View style={styles.summaryCard}>
                  <Text style={styles.summaryEmoji}>🎮</Text>
                  <Text style={styles.summaryValue}>{resumenGlobal.partidas}</Text>
                  <Text style={styles.summaryLabel}>Partidas</Text>
                </View>
                <View style={styles.summaryCard}>
                  <Text style={styles.summaryEmoji}>⏱️</Text>
                  <Text style={styles.summaryValue}>{formatTiempo(resumenGlobal.tiempo)}</Text>
                  <Text style={styles.summaryLabel}>Tiempo total</Text>
                </View>
                <View style={styles.summaryCard}>
                  <Text style={styles.summaryEmoji}>⭐</Text>
                  <Text style={styles.summaryValue}>{resumenGlobal.media}</Text>
                  <Text style={styles.summaryLabel}>Puntuación media</Text>
                </View>
                <View style={styles.summaryCard}>
                  <Text style={styles.summaryEmoji}>🔥</Text>
                  <Text style={styles.summaryValue}>{resumenGlobal.racha}</Text>
                  <Text style={styles.summaryLabel}>{resumenGlobal.racha === 1 ? 'Día de racha' : 'Días de racha'}</Text>
                </View>
              </View>

              {/* Actividad semanal */}
              <View style={styles.chartSection}>
                <Text style={styles.chartTitle} accessibilityRole="header">
                  📅 Actividad semanal
                </Text>
                <View style={styles.chartCard}>
                  <BarChart
                    data={{
                      labels: actividadSemanal.labels,
                      datasets: [{ data: actividadSemanal.data.map((d) => d || 0) }],
                    }}
                    width={CHART_WIDTH}
                    height={180}
                    fromZero
                    chartConfig={{
                      ...CHART_CONFIG_BASE,
                      barPercentage: 0.6,
                    }}
                    style={styles.chart}
                    showValuesOnTopOfBars
                    withInnerLines={false}
                  />
                </View>
              </View>

              {/* Puntuación media por área */}
              {areaStats.length > 0 && (
                <View style={styles.chartSection}>
                  <Text style={styles.chartTitle} accessibilityRole="header">
                    🎯 Puntuación media por área
                  </Text>
                  <View style={styles.chartCard}>
                    <BarChart
                      data={{
                        labels: areaStats.map((a) => a.area),
                        datasets: [{
                          data: areaStats.map((a) => a.media || 0),
                        }],
                      }}
                      width={CHART_WIDTH}
                      height={200}
                      fromZero
                      chartConfig={{
                        ...CHART_CONFIG_BASE,
                        barPercentage: 0.5,
                        color: (opacity = 1) => `rgba(21, 101, 192, ${opacity})`,
                      }}
                      style={styles.chart}
                      showValuesOnTopOfBars
                      withInnerLines={false}
                    />
                  </View>
                </View>
              )}
            </View>
          )}

          {/* ============ TAB ÁREAS ============ */}
          {activeTab === 'areas' && (
            <View style={styles.tabContent}>
              {areaStats.map((area) => (
                <View key={area.area} style={styles.areaCard}>
                  <View style={styles.areaHeader}>
                    <Text style={styles.areaEmoji}>{AREA_EMOJIS[area.area] || '📊'}</Text>
                    <View style={styles.areaHeaderText}>
                      <Text style={styles.areaTitle}>{area.area}</Text>
                      <View style={[styles.areaBadge, { backgroundColor: AREA_COLORS[area.area] || colors.primary }]}>
                        <Text style={styles.areaBadgeText}>Media: {area.media} pts</Text>
                      </View>
                    </View>
                  </View>

                  <View style={styles.areaStatsRow}>
                    <View style={styles.areaStat}>
                      <Text style={styles.areaStatValue}>{area.partidas}</Text>
                      <Text style={styles.areaStatLabel}>Partidas</Text>
                    </View>
                    <View style={styles.areaStat}>
                      <Text style={styles.areaStatValue}>{formatTiempo(area.tiempo)}</Text>
                      <Text style={styles.areaStatLabel}>Tiempo</Text>
                    </View>
                    <View style={styles.areaStat}>
                      <Text style={styles.areaStatValue}>{area.media}</Text>
                      <Text style={styles.areaStatLabel}>Puntuación</Text>
                    </View>
                  </View>

                  {/* Barra de nivel */}
                  <View style={styles.areaBarContainer}>
                    <View style={styles.areaBarBg}>
                      <View
                        style={[
                          styles.areaBarFill,
                          {
                            width: `${Math.min(area.media, 100)}%`,
                            backgroundColor: AREA_COLORS[area.area] || colors.primary,
                          },
                        ]}
                      />
                    </View>
                  </View>

                  {/* Juegos del área */}
                  {(juegosPorArea[area.area] || []).map((j) => (
                    <View key={j.juego_id} style={styles.areaGameRow}>
                      <Text style={styles.areaGameEmoji}>{JUEGO_EMOJIS[j.nombre_juego] || '🎯'}</Text>
                      <Text style={styles.areaGameName} numberOfLines={1}>{j.nombre_juego}</Text>
                      <Text style={styles.areaGameScore}>{j.media} pts</Text>
                    </View>
                  ))}
                </View>
              ))}
            </View>
          )}

          {/* ============ TAB JUEGOS ============ */}
          {activeTab === 'juegos' && (
            <View style={styles.tabContent}>
              {Object.entries(juegosPorArea).map(([area, juegos]) => (
                <View key={area}>
                  <Text style={styles.groupTitle} accessibilityRole="header">
                    {AREA_EMOJIS[area] || '📊'} {area}
                  </Text>
                  {juegos.map((juego) => {
                    const isExpanded = expandedGame === juego.juego_id;
                    const puntData = buildLineData(juego.resultados, 'puntuacion');
                    const nivelData = buildLineData(juego.resultados, 'nivel_dificultad');
                    return (
                      <View key={juego.juego_id} style={styles.gameCard}>
                        <TouchableOpacity
                          style={styles.gameCardHeader}
                          onPress={() => setExpandedGame(isExpanded ? null : juego.juego_id)}
                          accessibilityRole="button"
                          accessibilityLabel={`${juego.nombre_juego}, ${juego.totalPartidas} partidas, media ${juego.media}`}
                          accessibilityState={{ expanded: isExpanded }}
                        >
                          <Text style={styles.gameEmoji}>
                            {JUEGO_EMOJIS[juego.nombre_juego] || '🎯'}
                          </Text>
                          <View style={styles.gameInfo}>
                            <Text style={styles.gameName}>{juego.nombre_juego}</Text>
                            <Text style={styles.gameSubtitle}>
                              {juego.totalPartidas} partidas · Media: {juego.media}
                            </Text>
                          </View>
                          <Text style={styles.gameArrow}>{isExpanded ? '▼' : '›'}</Text>
                        </TouchableOpacity>

                        {isExpanded && (
                          <View style={styles.gameExpanded}>
                            {/* Métricas */}
                            <View style={styles.gameMetrics}>
                              <View style={styles.gameMetric}>
                                <Text style={styles.metricValue}>{juego.maxPunt}</Text>
                                <Text style={styles.metricLabel}>Máxima</Text>
                              </View>
                              <View style={styles.gameMetric}>
                                <Text style={styles.metricValue}>{juego.media}</Text>
                                <Text style={styles.metricLabel}>Media</Text>
                              </View>
                              <View style={styles.gameMetric}>
                                <Text style={styles.metricValue}>{juego.ultimaPunt}</Text>
                                <Text style={styles.metricLabel}>Última</Text>
                              </View>
                              <View style={styles.gameMetric}>
                                <Text style={styles.metricValue}>{juego.nivelActual}</Text>
                                <Text style={styles.metricLabel}>Nivel</Text>
                              </View>
                            </View>

                            <Text style={styles.gameMetricExtra}>
                              ⏱️ Tiempo total: {formatTiempo(juego.tiempoTotal)}
                            </Text>

                            {/* Gráfica evolución puntuación */}
                            {puntData && puntData.datasets[0].data.length >= 2 && (
                              <View style={styles.gameChartSection}>
                                <Text style={styles.gameChartLabel}>📈 Evolución puntuación</Text>
                                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                                  <LineChart
                                    data={puntData}
                                    width={Math.max(CHART_WIDTH, puntData.labels.length * 50)}
                                    height={170}
                                    chartConfig={{
                                      ...CHART_CONFIG_BASE,
                                      color: (opacity = 1) => `rgba(27, 94, 32, ${opacity})`,
                                    }}
                                    bezier
                                    style={styles.chart}
                                    fromZero
                                    withInnerLines={false}
                                  />
                                </ScrollView>
                              </View>
                            )}

                            {/* Gráfica progresión nivel */}
                            {nivelData && nivelData.datasets[0].data.length >= 2 && (
                              <View style={styles.gameChartSection}>
                                <Text style={styles.gameChartLabel}>📊 Progresión de nivel</Text>
                                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                                  <LineChart
                                    data={nivelData}
                                    width={Math.max(CHART_WIDTH, nivelData.labels.length * 50)}
                                    height={170}
                                    chartConfig={{
                                      ...CHART_CONFIG_BASE,
                                      color: (opacity = 1) => `rgba(21, 101, 192, ${opacity})`,
                                      propsForDots: { r: '4', strokeWidth: '2', stroke: '#1565C0' },
                                    }}
                                    bezier
                                    style={styles.chart}
                                    fromZero
                                    withInnerLines={false}
                                  />
                                </ScrollView>
                              </View>
                            )}

                            {(!puntData || puntData.datasets[0].data.length < 2) && (
                              <Text style={styles.chartHint}>
                                Juega al menos 2 partidas para ver las gráficas de evolución
                              </Text>
                            )}
                          </View>
                        )}
                      </View>
                    );
                  })}
                </View>
              ))}
            </View>
          )}
        </>
      )}
    </ScrollView>
  );
}

// ================= ESTILOS =================
const getStyles = (f) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  contentContainer: {
    flexGrow: 1,
    paddingBottom: f.s(40),
  },
  header: {
    backgroundColor: colors.primary,
    paddingTop: f.s(50),
    paddingBottom: f.s(30),
    paddingHorizontal: f.s(24),
    alignItems: 'center',
  },
  headerEmoji: {
    fontSize: f.s(48),
    marginBottom: f.s(8),
  },
  headerTitle: {
    fontSize: f.h1,
    fontWeight: f.bold,
    color: colors.white,
  },

  // Error
  errorCard: {
    margin: f.s(24),
    padding: f.s(24),
    backgroundColor: '#FFEBEE',
    borderRadius: f.s(16),
    alignItems: 'center',
  },
  errorText: {
    fontSize: f.body,
    color: colors.danger,
    textAlign: 'center',
    marginBottom: 16,
  },
  retryBtn: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    backgroundColor: colors.danger,
    borderRadius: 12,
  },
  retryBtnText: {
    fontSize: f.body,
    fontWeight: f.semibold,
    color: colors.white,
  },

  // Empty
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
    minHeight: 400,
  },
  emptyEmoji: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: f.h2,
    fontWeight: f.bold,
    color: colors.text,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: f.body,
    color: colors.lightText,
    textAlign: 'center',
    lineHeight: 28,
  },

  // Tabs
  tabRow: {
    flexDirection: 'row',
    marginHorizontal: f.s(16),
    marginTop: f.s(16),
    backgroundColor: '#E8F5E9',
    borderRadius: f.s(12),
    padding: f.s(4),
  },
  tab: {
    flex: 1,
    paddingVertical: f.s(12),
    borderRadius: f.s(10),
    alignItems: 'center',
  },
  tabActive: {
    backgroundColor: colors.white,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
  },
  tabText: {
    fontSize: f.small,
    fontWeight: f.semibold,
    color: colors.lightText,
  },
  tabTextActive: {
    color: colors.primary,
    fontWeight: f.bold,
  },
  tabContent: {
    paddingHorizontal: f.s(16),
    paddingTop: f.s(16),
  },

  // Summary grid
  summaryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: f.s(12),
    marginBottom: f.s(24),
  },
  summaryCard: {
    width: '47%',
    backgroundColor: colors.white,
    borderRadius: f.s(16),
    padding: f.s(16),
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  summaryEmoji: {
    fontSize: f.s(32),
    marginBottom: f.s(4),
  },
  summaryValue: {
    fontSize: f.h2,
    fontWeight: f.bold,
    color: colors.text,
  },
  summaryLabel: {
    fontSize: 14,
    color: colors.lightText,
    textAlign: 'center',
    marginTop: 2,
  },

  // Chart sections
  chartSection: {
    marginBottom: f.s(24),
  },
  chartTitle: {
    fontSize: f.body,
    fontWeight: f.bold,
    color: colors.text,
    marginBottom: f.s(12),
  },
  chartCard: {
    backgroundColor: colors.white,
    borderRadius: f.s(16),
    padding: f.s(12),
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    alignItems: 'center',
  },
  chart: {
    borderRadius: f.s(12),
  },

  // Area cards
  areaCard: {
    backgroundColor: colors.white,
    borderRadius: f.s(16),
    padding: f.s(20),
    marginBottom: f.s(16),
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  areaHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: f.s(16),
  },
  areaEmoji: {
    fontSize: f.s(36),
    marginRight: f.s(12),
  },
  areaHeaderText: {
    flex: 1,
  },
  areaTitle: {
    fontSize: f.body,
    fontWeight: f.bold,
    color: colors.text,
  },
  areaBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: f.s(10),
    paddingVertical: f.s(3),
    borderRadius: f.s(8),
    marginTop: f.s(4),
  },
  areaBadgeText: {
    fontSize: 13,
    fontWeight: f.semibold,
    color: colors.white,
  },
  areaStatsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 16,
  },
  areaStat: {
    alignItems: 'center',
  },
  areaStatValue: {
    fontSize: f.body,
    fontWeight: f.bold,
    color: colors.text,
  },
  areaStatLabel: {
    fontSize: 13,
    color: colors.lightText,
    marginTop: 2,
  },
  areaBarContainer: {
    marginBottom: 16,
  },
  areaBarBg: {
    height: 8,
    backgroundColor: '#E0E0E0',
    borderRadius: 4,
    overflow: 'hidden',
  },
  areaBarFill: {
    height: 8,
    borderRadius: 4,
  },
  areaGameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  areaGameEmoji: {
    fontSize: 20,
    marginRight: 8,
  },
  areaGameName: {
    flex: 1,
    fontSize: f.small,
    color: colors.text,
  },
  areaGameScore: {
    fontSize: f.small,
    fontWeight: f.semibold,
    color: colors.primary,
  },

  // Group titles (juegos tab)
  groupTitle: {
    fontSize: f.body,
    fontWeight: f.bold,
    color: colors.text,
    marginBottom: 12,
    marginTop: 8,
  },

  // Game cards
  gameCard: {
    backgroundColor: colors.white,
    borderRadius: f.s(16),
    marginBottom: f.s(12),
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    overflow: 'hidden',
  },
  gameCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: f.s(16),
  },
  gameEmoji: {
    fontSize: f.s(32),
    marginRight: f.s(12),
  },
  gameInfo: {
    flex: 1,
  },
  gameName: {
    fontSize: f.body,
    fontWeight: f.semibold,
    color: colors.text,
  },
  gameSubtitle: {
    fontSize: 14,
    color: colors.lightText,
    marginTop: 2,
  },
  gameArrow: {
    fontSize: 24,
    color: colors.lightText,
    marginLeft: 8,
  },

  // Expanded game
  gameExpanded: {
    paddingHorizontal: f.s(16),
    paddingBottom: f.s(16),
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  gameMetrics: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: f.s(16),
  },
  gameMetric: {
    alignItems: 'center',
  },
  metricValue: {
    fontSize: f.body,
    fontWeight: f.bold,
    color: colors.text,
  },
  metricLabel: {
    fontSize: 13,
    color: colors.lightText,
    marginTop: 2,
  },
  gameMetricExtra: {
    fontSize: f.small,
    color: colors.lightText,
    textAlign: 'center',
    marginBottom: 16,
  },
  gameChartSection: {
    marginTop: 12,
  },
  gameChartLabel: {
    fontSize: f.small,
    fontWeight: f.semibold,
    color: colors.text,
    marginBottom: 8,
  },
  chartHint: {
    fontSize: f.small,
    color: colors.lightText,
    textAlign: 'center',
    fontStyle: 'italic',
    marginTop: 12,
  },
});

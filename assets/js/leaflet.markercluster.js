/*
 Leaflet.markercluster, Provides Beautiful Animated Marker Clustering functionality for Leaflet, a JS library for interactive maps.
 https://github.com/Leaflet/Leaflet.markercluster
 (c) 2012-2013, Dave Leaver, smartrak
 */
!(function (t, e) {
  (L.MarkerClusterGroup = L.FeatureGroup.extend({
    options: {
      maxClusterRadius: 80,
      iconCreateFunction: null,
      spiderfyOnMaxZoom: !0,
      showCoverageOnHover: !0,
      zoomToBoundsOnClick: !0,
      singleMarkerMode: !1,
      disableClusteringAtZoom: null,
      removeOutsideVisibleBounds: !0,
      animateAddingMarkers: !1,
      spiderfyDistanceMultiplier: 1,
      chunkedLoading: !1,
      chunkInterval: 200,
      chunkDelay: 50,
      chunkProgress: null,
      polygonOptions: {},
    },
    initialize: function (t) {
      L.Util.setOptions(this, t),
        this.options.iconCreateFunction ||
          (this.options.iconCreateFunction = this._defaultIconCreateFunction),
        (this._featureGroup = L.featureGroup()),
        this._featureGroup.on(
          L.FeatureGroup.EVENTS,
          this._propagateEvent,
          this
        ),
        (this._nonPointGroup = L.featureGroup()),
        this._nonPointGroup.on(
          L.FeatureGroup.EVENTS,
          this._propagateEvent,
          this
        ),
        (this._inZoomAnimation = 0),
        (this._needsClustering = []),
        (this._needsRemoving = []),
        (this._currentShownBounds = null),
        (this._queue = []);
    },
    addLayer: function (t) {
      if (t instanceof L.LayerGroup) {
        var e = [];
        for (var i in t._layers) e.push(t._layers[i]);
        return this.addLayers(e);
      }
      if (!t.getLatLng) return this._nonPointGroup.addLayer(t), this;
      if (!this._map) return this._needsClustering.push(t), this;
      if (this.hasLayer(t)) return this;
      this._unspiderfy && this._unspiderfy(), this._addLayer(t, this._maxZoom);
      var n = t,
        s = this._map.getZoom();
      if (t.__parent) for (; n.__parent._zoom >= s; ) n = n.__parent;
      return (
        this._currentShownBounds.contains(n.getLatLng()) &&
          (this.options.animateAddingMarkers
            ? this._animationAddLayer(t, n)
            : this._animationAddLayerNonAnimated(t, n)),
        this
      );
    },
    removeLayer: function (t) {
      if (t instanceof L.LayerGroup) {
        var e = [];
        for (var i in t._layers) e.push(t._layers[i]);
        return this.removeLayers(e);
      }
      return t.getLatLng
        ? this._map
          ? t.__parent
            ? (this._unspiderfy &&
                (this._unspiderfy(), this._unspiderfyLayer(t)),
              this._removeLayer(t, !0),
              this._featureGroup.hasLayer(t) &&
                (this._featureGroup.removeLayer(t),
                t.setOpacity && t.setOpacity(1)),
              this)
            : this
          : (!this._arraySplice(this._needsClustering, t) &&
              this.hasLayer(t) &&
              this._needsRemoving.push(t),
            this)
        : (this._nonPointGroup.removeLayer(t), this);
    },
    addLayers: function (t) {
      var e,
        i,
        n,
        s,
        r = this._featureGroup,
        o = this._nonPointGroup,
        a = this.options.chunkedLoading,
        h = this.options.chunkInterval,
        _ = this.options.chunkProgress;
      if (this._map) {
        var u = 0,
          l = new Date().getTime(),
          d = L.bind(function () {
            for (var e = new Date().getTime(); u < t.length; u++) {
              if (a && 0 === u % 200) {
                var i = new Date().getTime() - e;
                if (i > h) break;
              }
              if (((s = t[u]), s.getLatLng)) {
                if (
                  !this.hasLayer(s) &&
                  (this._addLayer(s, this._maxZoom),
                  s.__parent && 2 === s.__parent.getChildCount())
                ) {
                  var n = s.__parent.getAllChildMarkers(),
                    p = n[0] === s ? n[1] : n[0];
                  r.removeLayer(p);
                }
              } else o.addLayer(s);
            }
            _ && _(u, t.length, new Date().getTime() - l),
              u === t.length
                ? (this._featureGroup.eachLayer(function (t) {
                    t instanceof L.MarkerCluster &&
                      t._iconNeedsUpdate &&
                      t._updateIcon();
                  }),
                  this._topClusterLevel._recursivelyAddChildrenToMap(
                    null,
                    this._zoom,
                    this._currentShownBounds
                  ))
                : setTimeout(d, this.options.chunkDelay);
          }, this);
        d();
      } else {
        for (e = [], i = 0, n = t.length; n > i; i++)
          (s = t[i]),
            s.getLatLng ? this.hasLayer(s) || e.push(s) : o.addLayer(s);
        this._needsClustering = this._needsClustering.concat(e);
      }
      return this;
    },
    removeLayers: function (t) {
      var e,
        i,
        n,
        s = this._featureGroup,
        r = this._nonPointGroup;
      if (!this._map) {
        for (e = 0, i = t.length; i > e; e++)
          (n = t[e]),
            this._arraySplice(this._needsClustering, n),
            r.removeLayer(n);
        return this;
      }
      for (e = 0, i = t.length; i > e; e++)
        (n = t[e]),
          n.__parent
            ? (this._removeLayer(n, !0, !0),
              s.hasLayer(n) &&
                (s.removeLayer(n), n.setOpacity && n.setOpacity(1)))
            : r.removeLayer(n);
      return (
        this._topClusterLevel._recursivelyAddChildrenToMap(
          null,
          this._zoom,
          this._currentShownBounds
        ),
        s.eachLayer(function (t) {
          t instanceof L.MarkerCluster && t._updateIcon();
        }),
        this
      );
    },
    clearLayers: function () {
      return (
        this._map ||
          ((this._needsClustering = []),
          delete this._gridClusters,
          delete this._gridUnclustered),
        this._noanimationUnspiderfy && this._noanimationUnspiderfy(),
        this._featureGroup.clearLayers(),
        this._nonPointGroup.clearLayers(),
        this.eachLayer(function (t) {
          delete t.__parent;
        }),
        this._map && this._generateInitialClusters(),
        this
      );
    },
    getBounds: function () {
      var t = new L.LatLngBounds();
      this._topClusterLevel && t.extend(this._topClusterLevel._bounds);
      for (var e = this._needsClustering.length - 1; e >= 0; e--)
        t.extend(this._needsClustering[e].getLatLng());
      return t.extend(this._nonPointGroup.getBounds()), t;
    },
    eachLayer: function (t, e) {
      var i,
        n = this._needsClustering.slice();
      for (
        this._topClusterLevel && this._topClusterLevel.getAllChildMarkers(n),
          i = n.length - 1;
        i >= 0;
        i--
      )
        t.call(e, n[i]);
      this._nonPointGroup.eachLayer(t, e);
    },
    getLayers: function () {
      var t = [];
      return (
        this.eachLayer(function (e) {
          t.push(e);
        }),
        t
      );
    },
    getLayer: function (t) {
      var e = null;
      return (
        this.eachLayer(function (i) {
          L.stamp(i) === t && (e = i);
        }),
        e
      );
    },
    hasLayer: function (t) {
      if (!t) return !1;
      var e,
        i = this._needsClustering;
      for (e = i.length - 1; e >= 0; e--) if (i[e] === t) return !0;
      for (i = this._needsRemoving, e = i.length - 1; e >= 0; e--)
        if (i[e] === t) return !1;
      return (
        !(!t.__parent || t.__parent._group !== this) ||
        this._nonPointGroup.hasLayer(t)
      );
    },
    zoomToShowLayer: function (t, e) {
      var i = function () {
        if ((t._icon || t.__parent._icon) && !this._inZoomAnimation)
          if (
            (this._map.off("moveend", i, this),
            this.off("animationend", i, this),
            t._icon)
          )
            e();
          else if (t.__parent._icon) {
            var n = function () {
              this.off("spiderfied", n, this), e();
            };
            this.on("spiderfied", n, this), t.__parent.spiderfy();
          }
      };
      t._icon && this._map.getBounds().contains(t.getLatLng())
        ? e()
        : t.__parent._zoom < this._map.getZoom()
        ? (this._map.on("moveend", i, this), this._map.panTo(t.getLatLng()))
        : (this._map.on("moveend", i, this),
          this.on("animationend", i, this),
          this._map.setView(t.getLatLng(), t.__parent._zoom + 1),
          t.__parent.zoomToBounds());
    },
    onAdd: function (t) {
      this._map = t;
      var e, i, n;
      if (!isFinite(this._map.getMaxZoom()))
        throw "Map has no maxZoom specified";
      for (
        this._featureGroup.onAdd(t),
          this._nonPointGroup.onAdd(t),
          this._gridClusters || this._generateInitialClusters(),
          e = 0,
          i = this._needsRemoving.length;
        i > e;
        e++
      )
        (n = this._needsRemoving[e]), this._removeLayer(n, !0);
      (this._needsRemoving = []),
        (this._zoom = this._map.getZoom()),
        (this._currentShownBounds = this._getExpandedVisibleBounds()),
        this._map.on("zoomend", this._zoomEnd, this),
        this._map.on("moveend", this._moveEnd, this),
        this._spiderfierOnAdd && this._spiderfierOnAdd(),
        this._bindEvents(),
        (i = this._needsClustering),
        (this._needsClustering = []),
        this.addLayers(i);
    },
    onRemove: function (t) {
      t.off("zoomend", this._zoomEnd, this),
        t.off("moveend", this._moveEnd, this),
        this._unbindEvents(),
        (this._map._mapPane.className = this._map._mapPane.className.replace(
          " leaflet-cluster-anim",
          ""
        )),
        this._spiderfierOnRemove && this._spiderfierOnRemove(),
        this._hideCoverage(),
        this._featureGroup.onRemove(t),
        this._nonPointGroup.onRemove(t),
        this._featureGroup.clearLayers(),
        (this._map = null);
    },
    getVisibleParent: function (t) {
      for (var e = t; e && !e._icon; ) e = e.__parent;
      return e || null;
    },
    _arraySplice: function (t, e) {
      for (var i = t.length - 1; i >= 0; i--)
        if (t[i] === e) return t.splice(i, 1), !0;
    },
    _removeLayer: function (t, e, i) {
      var n = this._gridClusters,
        s = this._gridUnclustered,
        r = this._featureGroup,
        o = this._map;
      if (e)
        for (
          var a = this._maxZoom;
          a >= 0 && s[a].removeObject(t, o.project(t.getLatLng(), a));
          a--
        );
      var h,
        _ = t.__parent,
        u = _._markers;
      for (this._arraySplice(u, t); _ && (_._childCount--, !(_._zoom < 0)); )
        e && _._childCount <= 1
          ? ((h = _._markers[0] === t ? _._markers[1] : _._markers[0]),
            n[_._zoom].removeObject(_, o.project(_._cLatLng, _._zoom)),
            s[_._zoom].addObject(h, o.project(h.getLatLng(), _._zoom)),
            this._arraySplice(_.__parent._childClusters, _),
            _.__parent._markers.push(h),
            (h.__parent = _.__parent),
            _._icon && (r.removeLayer(_), i || r.addLayer(h)))
          : (_._recalculateBounds(), (i && _._icon) || _._updateIcon()),
          (_ = _.__parent);
      delete t.__parent;
    },
    _isOrIsParent: function (t, e) {
      for (; e; ) {
        if (t === e) return !0;
        e = e.parentNode;
      }
      return !1;
    },
    _propagateEvent: function (t) {
      if (t.layer instanceof L.MarkerCluster) {
        if (
          t.originalEvent &&
          this._isOrIsParent(t.layer._icon, t.originalEvent.relatedTarget)
        )
          return;
        t.type = "cluster" + t.type;
      }
      this.fire(t.type, t);
    },
    _defaultIconCreateFunction: function (t) {
      var e = t.getChildCount(),
        i = " marker-cluster-";
      return (
        (i += 10 > e ? "small" : 100 > e ? "medium" : "large"),
        new L.DivIcon({
          html: "<div><span>" + e + "</span></div>",
          className: "marker-cluster" + i,
          iconSize: new L.Point(40, 40),
        })
      );
    },
    _bindEvents: function () {
      var t = this._map,
        e = this.options.spiderfyOnMaxZoom,
        i = this.options.showCoverageOnHover,
        n = this.options.zoomToBoundsOnClick;
      (e || n) && this.on("clusterclick", this._zoomOrSpiderfy, this),
        i &&
          (this.on("clustermouseover", this._showCoverage, this),
          this.on("clustermouseout", this._hideCoverage, this),
          t.on("zoomend", this._hideCoverage, this));
    },
    _zoomOrSpiderfy: function (t) {
      var e = this._map;
      e.getMaxZoom() === e.getZoom()
        ? this.options.spiderfyOnMaxZoom && t.layer.spiderfy()
        : this.options.zoomToBoundsOnClick && t.layer.zoomToBounds(),
        t.originalEvent &&
          13 === t.originalEvent.keyCode &&
          e._container.focus();
    },
    _showCoverage: function (t) {
      var e = this._map;
      this._inZoomAnimation ||
        (this._shownPolygon && e.removeLayer(this._shownPolygon),
        t.layer.getChildCount() > 2 &&
          t.layer !== this._spiderfied &&
          ((this._shownPolygon = new L.Polygon(
            t.layer.getConvexHull(),
            this.options.polygonOptions
          )),
          e.addLayer(this._shownPolygon)));
    },
    _hideCoverage: function () {
      this._shownPolygon &&
        (this._map.removeLayer(this._shownPolygon),
        (this._shownPolygon = null));
    },
    _unbindEvents: function () {
      var t = this.options.spiderfyOnMaxZoom,
        e = this.options.showCoverageOnHover,
        i = this.options.zoomToBoundsOnClick,
        n = this._map;
      (t || i) && this.off("clusterclick", this._zoomOrSpiderfy, this),
        e &&
          (this.off("clustermouseover", this._showCoverage, this),
          this.off("clustermouseout", this._hideCoverage, this),
          n.off("zoomend", this._hideCoverage, this));
    },
    _zoomEnd: function () {
      this._map &&
        (this._mergeSplitClusters(),
        (this._zoom = this._map._zoom),
        (this._currentShownBounds = this._getExpandedVisibleBounds()));
    },
    _moveEnd: function () {
      if (!this._inZoomAnimation) {
        var t = this._getExpandedVisibleBounds();
        this._topClusterLevel._recursivelyRemoveChildrenFromMap(
          this._currentShownBounds,
          this._zoom,
          t
        ),
          this._topClusterLevel._recursivelyAddChildrenToMap(
            null,
            this._map._zoom,
            t
          ),
          (this._currentShownBounds = t);
      }
    },
    _generateInitialClusters: function () {
      var t = this._map.getMaxZoom(),
        e = this.options.maxClusterRadius,
        i = e;
      "function" != typeof e &&
        (i = function () {
          return e;
        }),
        this.options.disableClusteringAtZoom &&
          (t = this.options.disableClusteringAtZoom - 1),
        (this._maxZoom = t),
        (this._gridClusters = {}),
        (this._gridUnclustered = {});
      for (var n = t; n >= 0; n--)
        (this._gridClusters[n] = new L.DistanceGrid(i(n))),
          (this._gridUnclustered[n] = new L.DistanceGrid(i(n)));
      this._topClusterLevel = new L.MarkerCluster(this, -1);
    },
    _addLayer: function (t, e) {
      var i,
        n,
        s = this._gridClusters,
        r = this._gridUnclustered;
      for (
        this.options.singleMarkerMode &&
        (t.options.icon = this.options.iconCreateFunction({
          getChildCount: function () {
            return 1;
          },
          getAllChildMarkers: function () {
            return [t];
          },
        }));
        e >= 0;
        e--
      ) {
        i = this._map.project(t.getLatLng(), e);
        var o = s[e].getNearObject(i);
        if (o) return o._addChild(t), (t.__parent = o), void 0;
        if ((o = r[e].getNearObject(i))) {
          var a = o.__parent;
          a && this._removeLayer(o, !1);
          var h = new L.MarkerCluster(this, e, o, t);
          s[e].addObject(h, this._map.project(h._cLatLng, e)),
            (o.__parent = h),
            (t.__parent = h);
          var _ = h;
          for (n = e - 1; n > a._zoom; n--)
            (_ = new L.MarkerCluster(this, n, _)),
              s[n].addObject(_, this._map.project(o.getLatLng(), n));
          for (
            a._addChild(_), n = e;
            n >= 0 && r[n].removeObject(o, this._map.project(o.getLatLng(), n));
            n--
          );
          return;
        }
        r[e].addObject(t, i);
      }
      this._topClusterLevel._addChild(t), (t.__parent = this._topClusterLevel);
    },
    _enqueue: function (t) {
      this._queue.push(t),
        this._queueTimeout ||
          (this._queueTimeout = setTimeout(
            L.bind(this._processQueue, this),
            300
          ));
    },
    _processQueue: function () {
      for (var t = 0; t < this._queue.length; t++) this._queue[t].call(this);
      (this._queue.length = 0),
        clearTimeout(this._queueTimeout),
        (this._queueTimeout = null);
    },
    _mergeSplitClusters: function () {
      this._processQueue(),
        this._zoom < this._map._zoom &&
        this._currentShownBounds.contains(this._getExpandedVisibleBounds())
          ? (this._animationStart(),
            this._topClusterLevel._recursivelyRemoveChildrenFromMap(
              this._currentShownBounds,
              this._zoom,
              this._getExpandedVisibleBounds()
            ),
            this._animationZoomIn(this._zoom, this._map._zoom))
          : this._zoom > this._map._zoom
          ? (this._animationStart(),
            this._animationZoomOut(this._zoom, this._map._zoom))
          : this._moveEnd();
    },
    _getExpandedVisibleBounds: function () {
      if (!this.options.removeOutsideVisibleBounds) return this.getBounds();
      var t = this._map,
        e = t.getBounds(),
        i = e._southWest,
        n = e._northEast,
        s = L.Browser.mobile ? 0 : Math.abs(i.lat - n.lat),
        r = L.Browser.mobile ? 0 : Math.abs(i.lng - n.lng);
      return new L.LatLngBounds(
        new L.LatLng(i.lat - s, i.lng - r, !0),
        new L.LatLng(n.lat + s, n.lng + r, !0)
      );
    },
    _animationAddLayerNonAnimated: function (t, e) {
      if (e === t) this._featureGroup.addLayer(t);
      else if (2 === e._childCount) {
        e._addToMap();
        var i = e.getAllChildMarkers();
        this._featureGroup.removeLayer(i[0]),
          this._featureGroup.removeLayer(i[1]);
      } else e._updateIcon();
    },
  })),
    L.MarkerClusterGroup.include(
      L.DomUtil.TRANSITION
        ? {
            _animationStart: function () {
              (this._map._mapPane.className += " leaflet-cluster-anim"),
                this._inZoomAnimation++;
            },
            _animationEnd: function () {
              this._map &&
                (this._map._mapPane.className =
                  this._map._mapPane.className.replace(
                    " leaflet-cluster-anim",
                    ""
                  )),
                this._inZoomAnimation--,
                this.fire("animationend");
            },
            _animationZoomIn: function (t, e) {
              var i,
                n = this._getExpandedVisibleBounds(),
                s = this._featureGroup;
              this._topClusterLevel._recursively(n, t, 0, function (r) {
                var o,
                  a = r._latlng,
                  h = r._markers;
                for (
                  n.contains(a) || (a = null),
                    r._isSingleParent() && t + 1 === e
                      ? (s.removeLayer(r),
                        r._recursivelyAddChildrenToMap(null, e, n))
                      : (r.setOpacity(0),
                        r._recursivelyAddChildrenToMap(a, e, n)),
                    i = h.length - 1;
                  i >= 0;
                  i--
                )
                  (o = h[i]), n.contains(o._latlng) || s.removeLayer(o);
              }),
                this._forceLayout(),
                this._topClusterLevel._recursivelyBecomeVisible(n, e),
                s.eachLayer(function (t) {
                  t instanceof L.MarkerCluster || !t._icon || t.setOpacity(1);
                }),
                this._topClusterLevel._recursively(n, t, e, function (t) {
                  t._recursivelyRestoreChildPositions(e);
                }),
                this._enqueue(function () {
                  this._topClusterLevel._recursively(n, t, 0, function (t) {
                    s.removeLayer(t), t.setOpacity(1);
                  }),
                    this._animationEnd();
                });
            },
            _animationZoomOut: function (t, e) {
              this._animationZoomOutSingle(this._topClusterLevel, t - 1, e),
                this._topClusterLevel._recursivelyAddChildrenToMap(
                  null,
                  e,
                  this._getExpandedVisibleBounds()
                ),
                this._topClusterLevel._recursivelyRemoveChildrenFromMap(
                  this._currentShownBounds,
                  t,
                  this._getExpandedVisibleBounds()
                );
            },
            _animationZoomOutSingle: function (t, e, i) {
              var n = this._getExpandedVisibleBounds();
              t._recursivelyAnimateChildrenInAndAddSelfToMap(n, e + 1, i);
              var s = this;
              this._forceLayout(),
                t._recursivelyBecomeVisible(n, i),
                this._enqueue(function () {
                  if (1 === t._childCount) {
                    var r = t._markers[0];
                    r.setLatLng(r.getLatLng()), r.setOpacity && r.setOpacity(1);
                  } else
                    t._recursively(n, i, 0, function (t) {
                      t._recursivelyRemoveChildrenFromMap(n, e + 1);
                    });
                  s._animationEnd();
                });
            },
            _animationAddLayer: function (t, e) {
              var i = this,
                n = this._featureGroup;
              n.addLayer(t),
                e !== t &&
                  (e._childCount > 2
                    ? (e._updateIcon(),
                      this._forceLayout(),
                      this._animationStart(),
                      t._setPos(this._map.latLngToLayerPoint(e.getLatLng())),
                      t.setOpacity(0),
                      this._enqueue(function () {
                        n.removeLayer(t), t.setOpacity(1), i._animationEnd();
                      }))
                    : (this._forceLayout(),
                      i._animationStart(),
                      i._animationZoomOutSingle(
                        e,
                        this._map.getMaxZoom(),
                        this._map.getZoom()
                      )));
            },
            _forceLayout: function () {
              L.Util.falseFn(e.body.offsetWidth);
            },
          }
        : {
            _animationStart: function () {},
            _animationZoomIn: function (t, e) {
              this._topClusterLevel._recursivelyRemoveChildrenFromMap(
                this._currentShownBounds,
                t
              ),
                this._topClusterLevel._recursivelyAddChildrenToMap(
                  null,
                  e,
                  this._getExpandedVisibleBounds()
                ),
                this.fire("animationend");
            },
            _animationZoomOut: function (t, e) {
              this._topClusterLevel._recursivelyRemoveChildrenFromMap(
                this._currentShownBounds,
                t
              ),
                this._topClusterLevel._recursivelyAddChildrenToMap(
                  null,
                  e,
                  this._getExpandedVisibleBounds()
                ),
                this.fire("animationend");
            },
            _animationAddLayer: function (t, e) {
              this._animationAddLayerNonAnimated(t, e);
            },
          }
    ),
    (L.markerClusterGroup = function (t) {
      return new L.MarkerClusterGroup(t);
    }),
    (L.MarkerCluster = L.Marker.extend({
      initialize: function (t, e, i, n) {
        L.Marker.prototype.initialize.call(
          this,
          i ? i._cLatLng || i.getLatLng() : new L.LatLng(0, 0),
          { icon: this }
        ),
          (this._group = t),
          (this._zoom = e),
          (this._markers = []),
          (this._childClusters = []),
          (this._childCount = 0),
          (this._iconNeedsUpdate = !0),
          (this._bounds = new L.LatLngBounds()),
          i && this._addChild(i),
          n && this._addChild(n);
      },
      getAllChildMarkers: function (t) {
        t = t || [];
        for (var e = this._childClusters.length - 1; e >= 0; e--)
          this._childClusters[e].getAllChildMarkers(t);
        for (var i = this._markers.length - 1; i >= 0; i--)
          t.push(this._markers[i]);
        return t;
      },
      getChildCount: function () {
        return this._childCount;
      },
      zoomToBounds: function () {
        for (
          var t,
            e = this._childClusters.slice(),
            i = this._group._map,
            n = i.getBoundsZoom(this._bounds),
            s = this._zoom + 1,
            r = i.getZoom();
          e.length > 0 && n > s;

        ) {
          s++;
          var o = [];
          for (t = 0; t < e.length; t++) o = o.concat(e[t]._childClusters);
          e = o;
        }
        n > s
          ? this._group._map.setView(this._latlng, s)
          : r >= n
          ? this._group._map.setView(this._latlng, r + 1)
          : this._group._map.fitBounds(this._bounds);
      },
      getBounds: function () {
        var t = new L.LatLngBounds();
        return t.extend(this._bounds), t;
      },
      _updateIcon: function () {
        (this._iconNeedsUpdate = !0), this._icon && this.setIcon(this);
      },
      createIcon: function () {
        return (
          this._iconNeedsUpdate &&
            ((this._iconObj = this._group.options.iconCreateFunction(this)),
            (this._iconNeedsUpdate = !1)),
          this._iconObj.createIcon()
        );
      },
      createShadow: function () {
        return this._iconObj.createShadow();
      },
      _addChild: function (t, e) {
        (this._iconNeedsUpdate = !0),
          this._expandBounds(t),
          t instanceof L.MarkerCluster
            ? (e || (this._childClusters.push(t), (t.__parent = this)),
              (this._childCount += t._childCount))
            : (e || this._markers.push(t), this._childCount++),
          this.__parent && this.__parent._addChild(t, !0);
      },
      _expandBounds: function (t) {
        var e,
          i = t._wLatLng || t._latlng;
        t instanceof L.MarkerCluster
          ? (this._bounds.extend(t._bounds), (e = t._childCount))
          : (this._bounds.extend(i), (e = 1)),
          this._cLatLng || (this._cLatLng = t._cLatLng || i);
        var n = this._childCount + e;
        this._wLatLng
          ? ((this._wLatLng.lat =
              (i.lat * e + this._wLatLng.lat * this._childCount) / n),
            (this._wLatLng.lng =
              (i.lng * e + this._wLatLng.lng * this._childCount) / n))
          : (this._latlng = this._wLatLng = new L.LatLng(i.lat, i.lng));
      },
      _addToMap: function (t) {
        t && ((this._backupLatlng = this._latlng), this.setLatLng(t)),
          this._group._featureGroup.addLayer(this);
      },
      _recursivelyAnimateChildrenIn: function (t, e, i) {
        this._recursively(
          t,
          0,
          i - 1,
          function (t) {
            var i,
              n,
              s = t._markers;
            for (i = s.length - 1; i >= 0; i--)
              (n = s[i]), n._icon && (n._setPos(e), n.setOpacity(0));
          },
          function (t) {
            var i,
              n,
              s = t._childClusters;
            for (i = s.length - 1; i >= 0; i--)
              (n = s[i]), n._icon && (n._setPos(e), n.setOpacity(0));
          }
        );
      },
      _recursivelyAnimateChildrenInAndAddSelfToMap: function (t, e, i) {
        this._recursively(t, i, 0, function (n) {
          n._recursivelyAnimateChildrenIn(
            t,
            n._group._map.latLngToLayerPoint(n.getLatLng()).round(),
            e
          ),
            n._isSingleParent() && e - 1 === i
              ? (n.setOpacity(1), n._recursivelyRemoveChildrenFromMap(t, e))
              : n.setOpacity(0),
            n._addToMap();
        });
      },
      _recursivelyBecomeVisible: function (t, e) {
        this._recursively(t, 0, e, null, function (t) {
          t.setOpacity(1);
        });
      },
      _recursivelyAddChildrenToMap: function (t, e, i) {
        this._recursively(
          i,
          -1,
          e,
          function (n) {
            if (e !== n._zoom)
              for (var s = n._markers.length - 1; s >= 0; s--) {
                var r = n._markers[s];
                i.contains(r._latlng) &&
                  (t &&
                    ((r._backupLatlng = r.getLatLng()),
                    r.setLatLng(t),
                    r.setOpacity && r.setOpacity(0)),
                  n._group._featureGroup.addLayer(r));
              }
          },
          function (e) {
            e._addToMap(t);
          }
        );
      },
      _recursivelyRestoreChildPositions: function (t) {
        for (var e = this._markers.length - 1; e >= 0; e--) {
          var i = this._markers[e];
          i._backupLatlng &&
            (i.setLatLng(i._backupLatlng), delete i._backupLatlng);
        }
        if (t - 1 === this._zoom)
          for (var n = this._childClusters.length - 1; n >= 0; n--)
            this._childClusters[n]._restorePosition();
        else
          for (var s = this._childClusters.length - 1; s >= 0; s--)
            this._childClusters[s]._recursivelyRestoreChildPositions(t);
      },
      _restorePosition: function () {
        this._backupLatlng &&
          (this.setLatLng(this._backupLatlng), delete this._backupLatlng);
      },
      _recursivelyRemoveChildrenFromMap: function (t, e, i) {
        var n, s;
        this._recursively(
          t,
          -1,
          e - 1,
          function (t) {
            for (s = t._markers.length - 1; s >= 0; s--)
              (n = t._markers[s]),
                (i && i.contains(n._latlng)) ||
                  (t._group._featureGroup.removeLayer(n),
                  n.setOpacity && n.setOpacity(1));
          },
          function (t) {
            for (s = t._childClusters.length - 1; s >= 0; s--)
              (n = t._childClusters[s]),
                (i && i.contains(n._latlng)) ||
                  (t._group._featureGroup.removeLayer(n),
                  n.setOpacity && n.setOpacity(1));
          }
        );
      },
      _recursively: function (t, e, i, n, s) {
        var r,
          o,
          a = this._childClusters,
          h = this._zoom;
        if (e > h)
          for (r = a.length - 1; r >= 0; r--)
            (o = a[r]),
              t.intersects(o._bounds) && o._recursively(t, e, i, n, s);
        else if ((n && n(this), s && this._zoom === i && s(this), i > h))
          for (r = a.length - 1; r >= 0; r--)
            (o = a[r]),
              t.intersects(o._bounds) && o._recursively(t, e, i, n, s);
      },
      _recalculateBounds: function () {
        var t,
          e = this._markers,
          i = this._childClusters;
        for (
          this._bounds = new L.LatLngBounds(),
            delete this._wLatLng,
            t = e.length - 1;
          t >= 0;
          t--
        )
          this._expandBounds(e[t]);
        for (t = i.length - 1; t >= 0; t--) this._expandBounds(i[t]);
      },
      _isSingleParent: function () {
        return (
          this._childClusters.length > 0 &&
          this._childClusters[0]._childCount === this._childCount
        );
      },
    })),
    (L.DistanceGrid = function (t) {
      (this._cellSize = t),
        (this._sqCellSize = t * t),
        (this._grid = {}),
        (this._objectPoint = {});
    }),
    (L.DistanceGrid.prototype = {
      addObject: function (t, e) {
        var i = this._getCoord(e.x),
          n = this._getCoord(e.y),
          s = this._grid,
          r = (s[n] = s[n] || {}),
          o = (r[i] = r[i] || []),
          a = L.Util.stamp(t);
        (this._objectPoint[a] = e), o.push(t);
      },
      updateObject: function (t, e) {
        this.removeObject(t), this.addObject(t, e);
      },
      removeObject: function (t, e) {
        var i,
          n,
          s = this._getCoord(e.x),
          r = this._getCoord(e.y),
          o = this._grid,
          a = (o[r] = o[r] || {}),
          h = (a[s] = a[s] || []);
        for (
          delete this._objectPoint[L.Util.stamp(t)], i = 0, n = h.length;
          n > i;
          i++
        )
          if (h[i] === t) return h.splice(i, 1), 1 === n && delete a[s], !0;
      },
      eachObject: function (t, e) {
        var i,
          n,
          s,
          r,
          o,
          a,
          h,
          _ = this._grid;
        for (i in _) {
          o = _[i];
          for (n in o)
            for (a = o[n], s = 0, r = a.length; r > s; s++)
              (h = t.call(e, a[s])), h && (s--, r--);
        }
      },
      getNearObject: function (t) {
        var e,
          i,
          n,
          s,
          r,
          o,
          a,
          h,
          _ = this._getCoord(t.x),
          u = this._getCoord(t.y),
          l = this._objectPoint,
          d = this._sqCellSize,
          p = null;
        for (e = u - 1; u + 1 >= e; e++)
          if ((s = this._grid[e]))
            for (i = _ - 1; _ + 1 >= i; i++)
              if ((r = s[i]))
                for (n = 0, o = r.length; o > n; n++)
                  (a = r[n]),
                    (h = this._sqDist(l[L.Util.stamp(a)], t)),
                    d > h && ((d = h), (p = a));
        return p;
      },
      _getCoord: function (t) {
        return Math.floor(t / this._cellSize);
      },
      _sqDist: function (t, e) {
        var i = e.x - t.x,
          n = e.y - t.y;
        return i * i + n * n;
      },
    }),
    (function () {
      L.QuickHull = {
        getDistant: function (t, e) {
          var i = e[1].lat - e[0].lat,
            n = e[0].lng - e[1].lng;
          return n * (t.lat - e[0].lat) + i * (t.lng - e[0].lng);
        },
        findMostDistantPointFromBaseLine: function (t, e) {
          var i,
            n,
            s,
            r = 0,
            o = null,
            a = [];
          for (i = e.length - 1; i >= 0; i--)
            (n = e[i]),
              (s = this.getDistant(n, t)),
              s > 0 && (a.push(n), s > r && ((r = s), (o = n)));
          return { maxPoint: o, newPoints: a };
        },
        buildConvexHull: function (t, e) {
          var i = [],
            n = this.findMostDistantPointFromBaseLine(t, e);
          return n.maxPoint
            ? ((i = i.concat(
                this.buildConvexHull([t[0], n.maxPoint], n.newPoints)
              )),
              (i = i.concat(
                this.buildConvexHull([n.maxPoint, t[1]], n.newPoints)
              )))
            : [t[0]];
        },
        getConvexHull: function (t) {
          var e,
            i = !1,
            n = !1,
            s = null,
            r = null;
          for (e = t.length - 1; e >= 0; e--) {
            var o = t[e];
            (i === !1 || o.lat > i) && ((s = o), (i = o.lat)),
              (n === !1 || o.lat < n) && ((r = o), (n = o.lat));
          }
          var a = [].concat(
            this.buildConvexHull([r, s], t),
            this.buildConvexHull([s, r], t)
          );
          return a;
        },
      };
    })(),
    L.MarkerCluster.include({
      getConvexHull: function () {
        var t,
          e,
          i = this.getAllChildMarkers(),
          n = [];
        for (e = i.length - 1; e >= 0; e--) (t = i[e].getLatLng()), n.push(t);
        return L.QuickHull.getConvexHull(n);
      },
    }),
    L.MarkerCluster.include({
      _2PI: 2 * Math.PI,
      _circleFootSeparation: 25,
      _circleStartAngle: Math.PI / 6,
      _spiralFootSeparation: 28,
      _spiralLengthStart: 11,
      _spiralLengthFactor: 5,
      _circleSpiralSwitchover: 9,
      spiderfy: function () {
        if (this._group._spiderfied !== this && !this._group._inZoomAnimation) {
          var t,
            e = this.getAllChildMarkers(),
            i = this._group,
            n = i._map,
            s = n.latLngToLayerPoint(this._latlng);
          this._group._unspiderfy(),
            (this._group._spiderfied = this),
            e.length >= this._circleSpiralSwitchover
              ? (t = this._generatePointsSpiral(e.length, s))
              : ((s.y += 10), (t = this._generatePointsCircle(e.length, s))),
            this._animationSpiderfy(e, t);
        }
      },
      unspiderfy: function (t) {
        this._group._inZoomAnimation ||
          (this._animationUnspiderfy(t), (this._group._spiderfied = null));
      },
      _generatePointsCircle: function (t, e) {
        var i,
          n,
          s =
            this._group.options.spiderfyDistanceMultiplier *
            this._circleFootSeparation *
            (2 + t),
          r = s / this._2PI,
          o = this._2PI / t,
          a = [];
        for (a.length = t, i = t - 1; i >= 0; i--)
          (n = this._circleStartAngle + i * o),
            (a[i] = new L.Point(
              e.x + r * Math.cos(n),
              e.y + r * Math.sin(n)
            )._round());
        return a;
      },
      _generatePointsSpiral: function (t, e) {
        var i,
          n =
            this._group.options.spiderfyDistanceMultiplier *
            this._spiralLengthStart,
          s =
            this._group.options.spiderfyDistanceMultiplier *
            this._spiralFootSeparation,
          r =
            this._group.options.spiderfyDistanceMultiplier *
            this._spiralLengthFactor,
          o = 0,
          a = [];
        for (a.length = t, i = t - 1; i >= 0; i--)
          (o += s / n + 5e-4 * i),
            (a[i] = new L.Point(
              e.x + n * Math.cos(o),
              e.y + n * Math.sin(o)
            )._round()),
            (n += (this._2PI * r) / o);
        return a;
      },
      _noanimationUnspiderfy: function () {
        var t,
          e,
          i = this._group,
          n = i._map,
          s = i._featureGroup,
          r = this.getAllChildMarkers();
        for (this.setOpacity(1), e = r.length - 1; e >= 0; e--)
          (t = r[e]),
            s.removeLayer(t),
            t._preSpiderfyLatlng &&
              (t.setLatLng(t._preSpiderfyLatlng), delete t._preSpiderfyLatlng),
            t.setZIndexOffset && t.setZIndexOffset(0),
            t._spiderLeg && (n.removeLayer(t._spiderLeg), delete t._spiderLeg);
        i._spiderfied = null;
      },
    }),
    L.MarkerCluster.include(
      L.DomUtil.TRANSITION
        ? {
            SVG_ANIMATION: (function () {
              return (
                e
                  .createElementNS("http://www.w3.org/2000/svg", "animate")
                  .toString()
                  .indexOf("SVGAnimate") > -1
              );
            })(),
            _animationSpiderfy: function (t, i) {
              var n,
                s,
                r,
                o,
                a = this,
                h = this._group,
                _ = h._map,
                u = h._featureGroup,
                l = _.latLngToLayerPoint(this._latlng);
              for (n = t.length - 1; n >= 0; n--)
                (s = t[n]),
                  s.setOpacity
                    ? (s.setZIndexOffset(1e6),
                      s.setOpacity(0),
                      u.addLayer(s),
                      s._setPos(l))
                    : u.addLayer(s);
              h._forceLayout(), h._animationStart();
              var d = L.Path.SVG ? 0 : 0.3,
                p = L.Path.SVG_NS;
              for (n = t.length - 1; n >= 0; n--)
                if (
                  ((o = _.layerPointToLatLng(i[n])),
                  (s = t[n]),
                  (s._preSpiderfyLatlng = s._latlng),
                  s.setLatLng(o),
                  s.setOpacity && s.setOpacity(1),
                  (r = new L.Polyline([a._latlng, o], {
                    weight: 1.5,
                    color: "#222",
                    opacity: d,
                  })),
                  _.addLayer(r),
                  (s._spiderLeg = r),
                  L.Path.SVG && this.SVG_ANIMATION)
                ) {
                  var c = r._path.getTotalLength();
                  r._path.setAttribute("stroke-dasharray", c + "," + c);
                  var m = e.createElementNS(p, "animate");
                  m.setAttribute("attributeName", "stroke-dashoffset"),
                    m.setAttribute("begin", "indefinite"),
                    m.setAttribute("from", c),
                    m.setAttribute("to", 0),
                    m.setAttribute("dur", 0.25),
                    r._path.appendChild(m),
                    m.beginElement(),
                    (m = e.createElementNS(p, "animate")),
                    m.setAttribute("attributeName", "stroke-opacity"),
                    m.setAttribute("attributeName", "stroke-opacity"),
                    m.setAttribute("begin", "indefinite"),
                    m.setAttribute("from", 0),
                    m.setAttribute("to", 0.5),
                    m.setAttribute("dur", 0.25),
                    r._path.appendChild(m),
                    m.beginElement();
                }
              if ((a.setOpacity(0.3), L.Path.SVG))
                for (this._group._forceLayout(), n = t.length - 1; n >= 0; n--)
                  (s = t[n]._spiderLeg),
                    (s.options.opacity = 0.5),
                    s._path.setAttribute("stroke-opacity", 0.5);
              setTimeout(function () {
                h._animationEnd(), h.fire("spiderfied");
              }, 200);
            },
            _animationUnspiderfy: function (t) {
              var e,
                i,
                n,
                s = this._group,
                r = s._map,
                o = s._featureGroup,
                a = t
                  ? r._latLngToNewLayerPoint(this._latlng, t.zoom, t.center)
                  : r.latLngToLayerPoint(this._latlng),
                h = this.getAllChildMarkers(),
                _ = L.Path.SVG && this.SVG_ANIMATION;
              for (
                s._animationStart(), this.setOpacity(1), i = h.length - 1;
                i >= 0;
                i--
              )
                (e = h[i]),
                  e._preSpiderfyLatlng &&
                    (e.setLatLng(e._preSpiderfyLatlng),
                    delete e._preSpiderfyLatlng,
                    e.setOpacity
                      ? (e._setPos(a), e.setOpacity(0))
                      : o.removeLayer(e),
                    _ &&
                      ((n = e._spiderLeg._path.childNodes[0]),
                      n.setAttribute("to", n.getAttribute("from")),
                      n.setAttribute("from", 0),
                      n.beginElement(),
                      (n = e._spiderLeg._path.childNodes[1]),
                      n.setAttribute("from", 0.5),
                      n.setAttribute("to", 0),
                      n.setAttribute("stroke-opacity", 0),
                      n.beginElement(),
                      e._spiderLeg._path.setAttribute("stroke-opacity", 0)));
              setTimeout(function () {
                var t = 0;
                for (i = h.length - 1; i >= 0; i--)
                  (e = h[i]), e._spiderLeg && t++;
                for (i = h.length - 1; i >= 0; i--)
                  (e = h[i]),
                    e._spiderLeg &&
                      (e.setOpacity && (e.setOpacity(1), e.setZIndexOffset(0)),
                      t > 1 && o.removeLayer(e),
                      r.removeLayer(e._spiderLeg),
                      delete e._spiderLeg);
                s._animationEnd();
              }, 200);
            },
          }
        : {
            _animationSpiderfy: function (t, e) {
              var i,
                n,
                s,
                r,
                o = this._group,
                a = o._map,
                h = o._featureGroup;
              for (i = t.length - 1; i >= 0; i--)
                (r = a.layerPointToLatLng(e[i])),
                  (n = t[i]),
                  (n._preSpiderfyLatlng = n._latlng),
                  n.setLatLng(r),
                  n.setZIndexOffset && n.setZIndexOffset(1e6),
                  h.addLayer(n),
                  (s = new L.Polyline([this._latlng, r], {
                    weight: 1.5,
                    color: "#222",
                  })),
                  a.addLayer(s),
                  (n._spiderLeg = s);
              this.setOpacity(0.3), o.fire("spiderfied");
            },
            _animationUnspiderfy: function () {
              this._noanimationUnspiderfy();
            },
          }
    ),
    L.MarkerClusterGroup.include({
      _spiderfied: null,
      _spiderfierOnAdd: function () {
        this._map.on("click", this._unspiderfyWrapper, this),
          this._map.options.zoomAnimation &&
            this._map.on("zoomstart", this._unspiderfyZoomStart, this),
          this._map.on("zoomend", this._noanimationUnspiderfy, this),
          L.Path.SVG && !L.Browser.touch && this._map._initPathRoot();
      },
      _spiderfierOnRemove: function () {
        this._map.off("click", this._unspiderfyWrapper, this),
          this._map.off("zoomstart", this._unspiderfyZoomStart, this),
          this._map.off("zoomanim", this._unspiderfyZoomAnim, this),
          this._unspiderfy();
      },
      _unspiderfyZoomStart: function () {
        this._map && this._map.on("zoomanim", this._unspiderfyZoomAnim, this);
      },
      _unspiderfyZoomAnim: function (t) {
        L.DomUtil.hasClass(this._map._mapPane, "leaflet-touching") ||
          (this._map.off("zoomanim", this._unspiderfyZoomAnim, this),
          this._unspiderfy(t));
      },
      _unspiderfyWrapper: function () {
        this._unspiderfy();
      },
      _unspiderfy: function (t) {
        this._spiderfied && this._spiderfied.unspiderfy(t);
      },
      _noanimationUnspiderfy: function () {
        this._spiderfied && this._spiderfied._noanimationUnspiderfy();
      },
      _unspiderfyLayer: function (t) {
        t._spiderLeg &&
          (this._featureGroup.removeLayer(t),
          t.setOpacity(1),
          t.setZIndexOffset(0),
          this._map.removeLayer(t._spiderLeg),
          delete t._spiderLeg);
      },
    });
})(window, document);

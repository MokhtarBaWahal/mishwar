import 'package:flutter/material.dart';

class MishwarBrand {
  static const Color primary = Color(0xFF14B8A6);
  static const Color primaryDark = Color(0xFF0F766E);
  static const Color accent = Color(0xFFF59E0B);
  static const Color background = Color(0xFF07131F);
  static const Color panel = Color(0xFF0F172A);
  static const Color card = Color(0xFF122333);
  static const Color surfaceAlt = Color(0xFF173A42);

  static const LinearGradient gradient = LinearGradient(
    begin: Alignment.topCenter,
    end: Alignment.bottomCenter,
    colors: [Color(0xFF07131F), Color(0xFF0F172A), Color(0xFF0E2A2D)],
  );

  static ThemeData buildTheme({required Brightness brightness, bool useDark = true}) {
    final base = colorSchemeFromBrightness(brightness, useDark: useDark);
    return ThemeData(
      useMaterial3: true,
      fontFamily: 'Cairo',
      scaffoldBackgroundColor: background,
      colorScheme: base,
      cardTheme: const CardThemeData(
        color: card,
        elevation: 0,
        margin: EdgeInsets.zero,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.all(Radius.circular(20)),
        ),
      ),
      appBarTheme: const AppBarTheme(
        backgroundColor: background,
        foregroundColor: Colors.white,
        elevation: 0,
        centerTitle: false,
      ),
      inputDecorationTheme: InputDecorationTheme(
        filled: true,
        fillColor: panel,
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(16),
          borderSide: BorderSide(color: Colors.white.withOpacity(0.08)),
        ),
        enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(16),
          borderSide: BorderSide(color: Colors.white.withOpacity(0.08)),
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(16),
          borderSide: BorderSide(color: primary, width: 1.4),
        ),
      ),
    );
  }

  static ColorScheme colorSchemeFromBrightness(Brightness brightness, {bool useDark = true}) {
    return ColorScheme.fromSeed(
      seedColor: primary,
      brightness: brightness,
      primary: primary,
      secondary: accent,
      surface: panel,
    );
  }
}

class MishwarBrandHeader extends StatelessWidget {
  const MishwarBrandHeader({super.key, this.subtitle, this.badgeText = 'موثوق'});

  final String? subtitle;
  final String badgeText;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        gradient: const LinearGradient(
          colors: [Color(0xFF0E1D2E), Color(0xFF123B39)],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
        borderRadius: BorderRadius.circular(24),
        border: Border.all(color: Colors.white.withOpacity(0.08)),
      ),
      child: Row(
        children: [
          Container(
            width: 52,
            height: 52,
            decoration: const BoxDecoration(
              gradient: LinearGradient(colors: [MishwarBrand.primary, MishwarBrand.accent]),
              shape: BoxShape.circle,
            ),
            child: const Icon(Icons.local_taxi_rounded, color: Colors.white, size: 26),
          ),
          const SizedBox(width: 14),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text(
                  'مشوار',
                  style: TextStyle(
                    fontSize: 26,
                    fontWeight: FontWeight.w800,
                    color: Colors.white,
                  ),
                ),
                if (subtitle != null)
                  Text(
                    subtitle!,
                    style: const TextStyle(
                      fontSize: 12,
                      color: Colors.white70,
                    ),
                  ),
              ],
            ),
          ),
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
            decoration: BoxDecoration(
              color: MishwarBrand.primary.withOpacity(0.14),
              borderRadius: BorderRadius.circular(999),
            ),
            child: Row(
              children: [
                const Icon(Icons.shield_outlined, size: 14, color: MishwarBrand.accent),
                const SizedBox(width: 6),
                Text(badgeText, style: const TextStyle(color: Colors.white, fontSize: 11)),
              ],
            ),
          )
        ],
      ),
    );
  }
}
